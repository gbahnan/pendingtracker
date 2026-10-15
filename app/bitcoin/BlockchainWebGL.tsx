"use client";
import HexagonLab from "../visual-test/HexagonLab";

type Block={height:number|null;ageMinutes:number;transactionCount:number|null;id:string|null};
type Projection={medianFee:number|null;feeRange:number[]|null};
type Props={
 pending:number|null|undefined;
 fee:number|null|undefined;
 blocks:Block[];
 projectedCount:number|null|undefined;
 projections?:Projection[];
 trackedPosition?:number|null;
 trackedFraction?:number|null;
 trackedConfirmedHeight?:number|null;
 compactTransactionLabels?:boolean;
 overview?:boolean;
};
export default function BlockchainWebGL({trackedPosition=null,trackedFraction=null,trackedConfirmedHeight=null}:Props){
 return <HexagonLab embedded trackedPosition={trackedPosition} trackedFraction={trackedFraction} trackedConfirmedHeight={trackedConfirmedHeight}/>;
}
