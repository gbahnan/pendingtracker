"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

const links=[
 {href:"/",label:"Home"},
 {href:"/bitcoin",label:"Bitcoin"},
 {href:"/ethereum",label:"Ethereum"},
 {href:"/faq",label:"FAQ"}
];
export default function ActiveNav(){
 const pathname=usePathname();
 return <nav className="nav pt-active-nav" aria-label="Main navigation">
  {links.map(({href,label})=>{
   const active=href==="/"?pathname==="/":pathname===href||pathname.startsWith(href+"/");
   return <Link key={href} href={href} aria-current={active?"page":undefined} className={active?"pt-nav-current":undefined}>{label}</Link>;
  })}
 </nav>;
}
