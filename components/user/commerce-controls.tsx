"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export function CheckoutButton({ planId, renewalSubscriptionId }: { planId: string; renewalSubscriptionId?: string }) {
  const [pending, setPending] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function checkout() { setPending(true); setError(""); try { const idempotencyKey = crypto.randomUUID(); const response = await fetch("/api/user/checkout", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ planId, renewalSubscriptionId }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "Unable to start checkout."); return; } if (data.checkoutUrl) router.push(data.checkoutUrl); } catch { setError("Unable to connect."); } finally { setPending(false); } }
  return <div className="commerce-action"><button className="member-primary-button" disabled={pending} onClick={checkout}>{pending ? "Starting…" : renewalSubscriptionId ? "Renew plan" : "Choose plan"} <Icon name="arrow" size={13}/></button>{error&&<small>{error}</small>}</div>;
}

export function ReviewEditor({ existing, targetId, type, verified }: { existing?: { score: number; comment: string | null }; targetId: string; type: "gym" | "trainer"; verified: boolean }) {
  const [score,setScore]=useState(existing?.score||5);const[comment,setComment]=useState(existing?.comment||"");const[pending,setPending]=useState("");const[message,setMessage]=useState("");const[error,setError]=useState("");const router=useRouter();const endpoint=`/api/user/reviews/${type==="gym"?"gyms":"trainers"}/${targetId}`;
  async function save(){setPending("save");setError("");setMessage("");try{const response=await fetch(endpoint,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({score,comment})});const data=await response.json();if(!response.ok){setError(data.error||"Unable to save review.");return}setMessage("Verified review saved.");router.refresh()}finally{setPending("")}}
  async function remove(){setPending("delete");try{const response=await fetch(endpoint,{method:"DELETE"});if(response.ok){setComment("");setMessage("Review removed.");router.refresh()}}finally{setPending("")}}
  if(!verified&&!existing)return <p className="review-eligibility"><Icon name="shield" size={15}/> Complete a verified {type==="gym"?"membership":"coaching relationship"} to leave a review.</p>;
  return <div className="review-editor"><div className="review-stars" aria-label={`${score} out of 5 stars`}>{[1,2,3,4,5].map(value=><button aria-label={`${value} stars`} className={value<=score?"active":""} key={value} onClick={()=>setScore(value)}>★</button>)}</div><textarea maxLength={1000} placeholder="Share a useful, respectful review…" rows={3} value={comment} onChange={event=>setComment(event.target.value)}/><div><button className="member-primary-button" disabled={Boolean(pending)} onClick={save}>{pending==="save"?"Saving…":existing?"Update review":"Publish review"}</button>{existing&&<button className="member-secondary-button" disabled={Boolean(pending)} onClick={remove}>{pending==="delete"?"Removing…":"Delete"}</button>}</div>{(message||error)&&<small className={error?"is-error":""}>{error||message}</small>}</div>;
}

export function CancelSubscriptionButton({ subscriptionId }: { subscriptionId: string }) { const[pending,setPending]=useState(false);const router=useRouter();async function cancel(){if(!confirm("Cancel this subscription and its pending payments?"))return;setPending(true);try{const response=await fetch(`/api/user/subscriptions/${subscriptionId}/cancel`,{method:"POST"});if(response.ok)router.refresh()}finally{setPending(false)}}return <button className="member-secondary-button" disabled={pending} onClick={cancel}>{pending?"Cancelling…":"Cancel subscription"}</button> }
