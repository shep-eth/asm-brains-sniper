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

const fetchFromElement = async (slug, after) => {
  const variables = {
    first: 50,
    realtime: true,
    thirdStandards: ["looksrare", "opensea"],
    collectionSlugs: [slug],
    sortAscending: false,
    sortBy: "PriceLowToHigh",
    toggles: ["BUY_NOW"],
    isPendingTx: false,
    isTraits: false,
  };

  if (after !== "") {
    variables.after = after;
  }

  const res = await axios({
    method: "POST",
    url: "https://api.element.market/graphql?args=AssetsListForCollectionV2",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      "content-type": "application/json",
      lang: "en-US",
      languagetype: "en-US",
      region: "other",
      "sec-ch-ua":
        '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "x-api-key": "zQbYj7RhC1VHIBdWU63ki5AJKXloamDT",
      "x-api-sign":
        "3b1dcfc2e1dbac22e4fa46216ead82d91cc4c9cf34d106211318c91ac9103262.5659.1675835900",
      "x-query-args": "AssetsListForCollectionV2",
      Referer: "https://element.market/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    data: {
      operationName: "AssetsListForCollectionV2",
      variables,
      query: `query AssetsListForCollectionV2($before: String, $after: String, $first: Int, $last: Int, $querystring: String, $categorySlugs: [String!], $collectionSlugs: [String!], $sortBy: SearchSortBy, $sortAscending: Boolean, $toggles: [SearchToggle!], $ownerAddress: Address, $creatorAddress: Address, $blockChains: [BlockChainInput!], $paymentTokens: [String!], $priceFilter: PriceFilterInput, $traitFilters: [AssetTraitFilterInput!], $contractAliases: [String!], $thirdStandards: [String!], $uiFlag: SearchUIFlag, $markets: [String!], $isTraits: Boolean!, $isPendingTx: Boolean!) {
  search: searchV2(
    before: $before
    after: $after
    first: $first
    last: $last
    search: {querystring: $querystring, categorySlugs: $categorySlugs, collectionSlugs: $collectionSlugs, sortBy: $sortBy, sortAscending: $sortAscending, toggles: $toggles, ownerAddress: $ownerAddress, creatorAddress: $creatorAddress, blockChains: $blockChains, paymentTokens: $paymentTokens, priceFilter: $priceFilter, traitFilters: $traitFilters, contractAliases: $contractAliases, uiFlag: $uiFlag, markets: $markets}
  ) {
    totalCount
    edges {
      cursor
      node {
        asset {
          chain
          chainId
          contractAddress
          tokenId
          tokenType
          name
          imagePreviewUrl
          imageThumbnailUrl
          animationUrl
          rarityRank
          orderData(standards: $thirdStandards) {
            bestAsk {
              ...BasicOrder
            }
            bestBid {
              ...BasicOrder
            }
          }
          assetEventData {
            lastSale {
              lastSalePrice
              lastSalePriceUSD
              lastSaleTokenContract {
                name
                address
                icon
                decimal
                accuracy
              }
            }
          }
          pendingTx @include(if: $isPendingTx) {
            time
            hash
            gasFeeMax
            gasFeePrio
            txFrom
            txTo
            market
          }
          traits @include(if: $isTraits) {
            trait
            numValue
          }
          collection {
            slug
          }
          suspiciousStatus
        }
      }
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
  }
}

fragment BasicOrder on OrderV3Type {
  __typename
  chain
  chainId
  chainMId
  expirationTime
  listingTime
  maker
  taker
  side
  saleKind
  paymentToken
  quantity
  priceBase
  priceUSD
  price
  standard
  contractAddress
  tokenId
  schema
  extra
  paymentTokenCoin {
    name
    address
    icon
    chain
    chainId
    decimal
    accuracy
  }
}
`,
    },
  });

  return res.data.data.search;
};

const fetchFromGenie = async (contractAddress, offset, limit) => {
  const res = await axios({
    method: "POST",
    url: "https://genie-production-api.herokuapp.com/assets",
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
  let after = "";
  let data = [];
  while (hasNext) {
    const newData = await fetchFromElement("asm-brains", after);
    after = newData.pageInfo.endCursor;
    hasNext = newData.pageInfo.hasNextPage;
    data = data.concat(newData.edges);
  }

  const brains = data.map((b) => ({
    tokenId: parseInt(b.node.asset.tokenId, 10),
    price: formatNumber(b.node.asset.orderData.bestAsk.price),
    market: b.node.asset.orderData.bestAsk.standard,
    iq: brainIQs[parseInt(b.node.asset.tokenId, 10)],
  }));

  const jobs = brains.map((b) => claimed(b));
  const result = await Promise.all(jobs);
  const obj = { data: result, updatedAt: Date.now() };
  const r = await client.set(REDIS_KEY, JSON.stringify(obj));

  res.status(200).json({ result: r });
});

export default handler;
