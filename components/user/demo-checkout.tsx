"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export function DemoCheckout({ paymentId, token }: { paymentId: string; token: string }) {
  const [pending,setPending]=useState("");const[error,setError]=useState("");const router=useRouter();
  async function act(action:"confirm"|"fail"){setPending(action);setError("");try{const response=await fetch(`/api/user/payments/${paymentId}/confirm`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,token})});const data=await response.json();if(!response.ok){setError(data.error||"به‌روزرسانی پرداخت انجام نشد.");return}router.push(`/user/subscriptions?payment=${action==="confirm"?"success":"failed"}`);router.refresh()}catch{setError("اتصال برقرار نشد.")}finally{setPending("")}}
  return <div className="demo-checkout-actions"><button className="member-primary-button" disabled={Boolean(pending)} onClick={()=>act("confirm")}><Icon name="check" size={15}/>{pending==="confirm"?"در حال پردازش…":"تکمیل پرداخت نمایشی"}</button><button className="member-secondary-button" disabled={Boolean(pending)} onClick={()=>act("fail")}>{pending==="fail"?"در حال پردازش…":"شبیه‌سازی رد پرداخت"}</button>{error&&<p className="member-form-error">{error}</p>}</div>;
}
