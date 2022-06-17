import axios from "axios";
import dotenv from "dotenv";
import Redis from "ioredis";
import nc from "next-connect";
import { ethers } from "ethers";
import { brainIQs } from "../../utils";

dotenv.config();

const AIRDROP_CONTRACT = "0x30EFB10082622869a3233A65Db5CBefc0ad351eB";
const ASM_BRAINS_CONTRACT = "0xd0318da435dbce0b347cc6faa330b5a9889e3585";
const GEM_API = "https://api-3.gemlabs.xyz/assets";
const GEM_PERPAGE = 300;
const REDIS_KEY = "asmbrains";

const client = new Redis(process.env.REDIS_URL);

const fetchFromGenie = async (contractAddress, offset, limit) => {
  const res = await axios({
    method: "POST",
    url: "https://v2.api.genie.xyz/assets",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36",
      Referer: "https://www.genie.xyz/",
      "Content-Type": "application/json; charset=utf-8",
    },
    data: {
      filters: {
        address: contractAddress,
        traits: {},
        searchText: "",
        notForSale: false,
        numTraits: [],
      },
      fields: {
        address: 1,
        name: 1,
        id: 1,
        imageUrl: 1,
        currentPrice: 1,
        currentUsdPrice: 1,
        paymentToken: 1,
        animationUrl: 1,
        notForSale: 1,
        rarity: 1,
      },
      limit,
      offset,
      markets: ["opensea", "looksrare", "x2y2"],
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

const nofityIQMissing = async (data) => {
  const tokenIDs = data.filter((d) => !d.iq).map((d) => d.tokenId.toString());
  if (tokenIDs.length > 0) {
    const content = `<@298315370303979520> Brain IDs to add IQ data: ${tokenIDs.join(
      ", "
    )}`;
    await axios.post(process.env.DC_WEBHOOK, { content });
  }
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
  let hasNext = true;
  let page = 0;
  let perPage = 50;
  let data = [];
  while (hasNext) {
    const offset = page * perPage;
    const newData = await fetchFromGenie(ASM_BRAINS_CONTRACT, offset, perPage);
    hasNext = newData.hasNext;
    data = data.concat(newData.data);
    page += 1;
  }

  const brains = data.map((b) => ({
    tokenId: parseInt(b.tokenId, 10),
    price: formatNumber(parseInt(b.basePrice, 10) / Math.pow(10, 18)),
    market: b.marketplace,
    iq: brainIQs[parseInt(b.tokenId, 10)],
  }));

  await nofityIQMissing(brains);

  const jobs = brains.map((b) => claimed(b));
  const result = await Promise.all(jobs);
  const obj = { data: result, updatedAt: Date.now() };
  const r = await client.set(REDIS_KEY, JSON.stringify(obj));

  res.status(200).json({ result: r });
});

export default handler;
