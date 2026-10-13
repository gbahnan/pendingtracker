import {NextResponse} from "next/server";
export const revalidate=60;
export async function GET(){
 try{
  const [priceRes,chartRes]=await Promise.allSettled([
   fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=24h",{next:{revalidate:60},signal:AbortSignal.timeout(6500)}).then(async r=>{if(!r.ok)throw Error("market unavailable");return r.json()}),
   fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1",{next:{revalidate:120},signal:AbortSignal.timeout(6500)}).then(async r=>{if(!r.ok)throw Error("chart unavailable");return r.json()})
  ]);
  const item=priceRes.status==="fulfilled"?priceRes.value?.[0]:null;
  const raw=chartRes.status==="fulfilled"?chartRes.value?.prices:null;
  const prices=Array.isArray(raw)?raw.filter((p:unknown):p is [number,number]=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])).map(p=>p[1]):[];
  const price=Number(item?.current_price);
  const change=Number(item?.price_change_percentage_24h);
  const valid=Number.isFinite(price)&&price>0;
  return NextResponse.json({price:valid?price:null,change24h:Number.isFinite(change)?change:null,low24h:Number.isFinite(Number(item?.low_24h))?Number(item.low_24h):null,high24h:Number.isFinite(Number(item?.high_24h))?Number(item.high_24h):null,chart:prices.length>2?prices.filter((_,i)=>i%Math.max(1,Math.floor(prices.length/55))===0).slice(-65):[],updatedAt:item?.last_updated??null,source:"CoinGecko"},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=120"}});
 }catch{return NextResponse.json({price:null,change24h:null,low24h:null,high24h:null,chart:[],updatedAt:null,source:"CoinGecko"},{status:200})}
}
