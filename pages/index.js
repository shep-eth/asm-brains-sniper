import Head from "next/head";
import Brains from "../components/Brains";
import Redis from "ioredis";

export async function getServerSideProps() {
  const REDIS_KEY = "asmbrains";
  const client = new Redis(process.env.REDIS_URL);
  const data = await client.get(REDIS_KEY);
  return {
    props: JSON.parse(data),
  };
}

export default function Home({ data, updatedAt }) {
  return (
    <div>
      <Head>
        <title>ASM Brains Sniper</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta
          name="description"
          content="List all ASM brains from the NFT marketplaces with $ASTO airdrop claim status."
        />
      </Head>
      <Brains data={data} updatedAt={updatedAt} />
    </div>
  );
}
