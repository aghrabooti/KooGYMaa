"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export function CheckoutButton({ planId, renewalSubscriptionId }: { planId: string; renewalSubscriptionId?: string }) {
  const [pending, setPending] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function checkout() { setPending(true); setError(""); try { const idempotencyKey = crypto.randomUUID(); const response = await fetch("/api/user/checkout", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ planId, renewalSubscriptionId }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "پرداخت شروع نشد."); return; } if (data.checkoutUrl) router.push(data.checkoutUrl); } catch { setError("اتصال برقرار نشد."); } finally { setPending(false); } }
  return <div className="commerce-action"><button className="member-primary-button" disabled={pending} onClick={checkout}>{pending ? "در حال شروع…" : renewalSubscriptionId ? "تمدید طرح" : "انتخاب طرح"} <Icon name="arrow" size={13}/></button>{error&&<small>{error}</small>}</div>;
}

export function ReviewEditor({ existing, targetId, type, verified }: { existing?: { score: number; comment: string | null }; targetId: string; type: "gym" | "trainer"; verified: boolean }) {
  const [score,setScore]=useState(existing?.score||5);const[comment,setComment]=useState(existing?.comment||"");const[pending,setPending]=useState("");const[message,setMessage]=useState("");const[error,setError]=useState("");const router=useRouter();const endpoint=`/api/user/reviews/${type==="gym"?"gyms":"trainers"}/${targetId}`;
  async function save(){setPending("save");setError("");setMessage("");try{const response=await fetch(endpoint,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({score,comment})});const data=await response.json();if(!response.ok){setError(data.error||"دیدگاه ذخیره نشد.");return}setMessage("دیدگاه تأییدشده ذخیره شد.");router.refresh()}finally{setPending("")}}
  async function remove(){setPending("delete");try{const response=await fetch(endpoint,{method:"DELETE"});if(response.ok){setComment("");setMessage("Review removed.");router.refresh()}}finally{setPending("")}}
  if(!verified&&!existing)return <p className="review-eligibility"><Icon name="shield" size={15}/> Complete a verified {type==="gym"?"membership":"رابطه مربی‌گری"} to leave a review.</p>;
  return <div className="review-editor"><div className="review-stars" aria-label={`${score} از ۵ ستاره`}>{[1,2,3,4,5].map(value=><button aria-label={`${value} ستاره`} className={value<=score?"active":""} key={value} onClick={()=>setScore(value)}>★</button>)}</div><textarea maxLength={1000} placeholder="دیدگاهی مفید و محترمانه بنویسید…" rows={3} value={comment} onChange={event=>setComment(event.target.value)}/><div><button className="member-primary-button" disabled={Boolean(pending)} onClick={save}>{pending==="save"?"در حال ذخیره…":existing?"به‌روزرسانی دیدگاه":"انتشار دیدگاه"}</button>{existing&&<button className="member-secondary-button" disabled={Boolean(pending)} onClick={remove}>{pending==="delete"?"در حال حذف…":"حذف"}</button>}</div>{(message||error)&&<small className={error?"is-error":""}>{error||message}</small>}</div>;
}

export function CancelSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  const[pending,setPending]=useState(false);const[message,setMessage]=useState("");const router=useRouter();
  async function cancel(){
    // Item 4: transparent cancellation — the user sees exactly what happens.
    if(!confirm("اشتراک بلافاصله لغو می‌شود، دسترسی باشگاه قطع و پرداخت‌های در انتظار لغو می‌شوند.\nپرداخت‌های موفق طبق قوانین بازپرداخت قابل بازگشت‌اند. ادامه می‌دهی؟"))return;
    setPending(true);setMessage("");
    try{
      const response=await fetch(`/api/user/subscriptions/${subscriptionId}/cancel`,{method:"POST"});
      const data=await response.json().catch(()=>({}));
      if(!response.ok){setMessage(data.error||"لغو ناموفق بود.");return;}
      setMessage(data.message||"اشتراک لغو شد.");router.refresh();
    } finally{setPending(false)}
  }
  return <span className="commerce-action"><button className="member-secondary-button" disabled={pending} onClick={cancel}>{pending?"در حال لغو…":"لغو اشتراک"}</button>{message&&<small>{message}</small>}</span>;
}

export function PauseSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  const[pending,setPending]=useState(false);const router=useRouter();
  async function pause(){
    const days=Number(prompt("توقف موقت چند روزه؟ (۱ تا ۶۰)","7")||"0");
    if(!days||days<1||days>60)return;setPending(true);
    try{const response=await fetch(`/api/user/subscriptions/${subscriptionId}/pause`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({days})});if(response.ok)router.refresh()}finally{setPending(false)}
  }
  return <button className="member-secondary-button" disabled={pending} onClick={pause}>{pending?"…":"⏸ توقف موقت"}</button>;
}

export function AutoRenewToggle({ subscriptionId, autoRenew }: { subscriptionId: string; autoRenew: boolean }) {
  const[pending,setPending]=useState(false);const[on,setOn]=useState(autoRenew);const router=useRouter();
  async function toggle(){
    setPending(true);
    try{
      const response=await fetch(`/api/user/subscriptions/${subscriptionId}/resume`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({autoRenew:!on})});
      if(response.ok){setOn(!on);router.refresh()}
    }finally{setPending(false)}
  }
  return <button className="member-secondary-button" disabled={pending} onClick={toggle} title="تمدید خودکار">🔁 {on?"تمدید خودکار: روشن":"تمدید خودکار: خاموش"}</button>;
}

export function ReceiptLink({ subscriptionId }: { subscriptionId: string }) {
  return <a className="member-secondary-button" href={`/api/user/subscriptions/${subscriptionId}/receipt`}>🧾 رسید</a>;
}
