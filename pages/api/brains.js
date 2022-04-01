import axios from "axios";
import dotenv from "dotenv";
import Redis from "ioredis";
import nc from "next-connect";
import { ethers } from "ethers";

dotenv.config();

const AIRDROP_CONTRACT = "0x30EFB10082622869a3233A65Db5CBefc0ad351eB";
const GEM_API = "https://gem-api-3.herokuapp.com/assets";
const GEM_PERPAGE = 300;
const REDIS_KEY = "asmbrains";

const client = new Redis(process.env.REDIS_URL);

const fetchData = async (slug) => {
  const res = await axios({
    method: "POST",
    url: GEM_API,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36",
      Origin: "https://www.gem.xyz",
      "Content-Type": "application/json; charset=utf-8",
    },
    data: {
      fields: {
        tokenId: 1,
        tokenReserves: 1,
        paymentToken: 1,
        ethReserves: 1,
        smallImageUrl: 1,
        market: 1,
        animationUrl: 1,
        currentBasePrice: 1,
        startingPrice: 1,
        rarityScore: 1,
        sellOrders: 1,
        collectionSymbol: 1,
        name: 1,
        imageUrl: 1,
        id: 1,
        standard: 1,
        externalLink: 1,
        collectionName: 1,
        marketplace: 1,
        priceInfo: 1,
        marketUrl: 1,
        address: 1,
      },
      status: ["buy_now"],
      filters: {
        slug: slug,
        traitsRange: {},
        traits: {},
        price: {},
      },
      offset: 0,
      sort: {
        currentEthPrice: "asc",
      },
      markets: ["opensea", "looksrare", "x2y2"],
      limit: GEM_PERPAGE,
    },
  });

  return res.data;
};

const claimed = async (brain) => {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.MAINNET_RPC
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const account = wallet.connect(provider);

  const abi = ["function claimed(uint256) external view returns (bool)"];
  const airdrop = new ethers.Contract(AIRDROP_CONTRACT, abi, account);
  const claimed = await airdrop.claimed(brain.tokenId);
  brain.claimed = claimed;
  return brain;
};

const formatNumber = (n) => {
  return parseFloat(n.toFixed(2));
};

const handler = nc({
  onError: (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Server Error!" });
  },
  onNoMatch: (req, res, next) => {
    res.status(404).json({ error: "API not found!" });
  },
}).post(async (req, res) => {
  const data = await fetchData("asm-brains");
  const brains = data.data.map((b) => ({
    tokenId: b.tokenId,
    price: formatNumber(b.currentBasePrice / Math.pow(10, 18)),
    market: b.market,
  }));

  const jobs = brains.map((b) => claimed(b));
  const result = await Promise.all(jobs);

  const claimedFloor = result.find((i) => i.claimed);
  const unclaimedFloor = result.find((i) => !i.claimed);
  const stats = {
    claimed: formatNumber(claimedFloor.price),
    unclaimed: formatNumber(unclaimedFloor.price),
    diff: formatNumber(unclaimedFloor.price - claimedFloor.price),
  };
  const obj = { stats, data: result, updatedAt: Date.now() };

  const r = await client.set(REDIS_KEY, JSON.stringify(obj));

  res.status(200).json({ result: r });
});

export default handler;
