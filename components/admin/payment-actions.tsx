"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefundButton({ gymId, paymentId }: { gymId: string; paymentId: string }) {
  const [pending,setPending]=useState(false);const[error,setError]=useState("");const router=useRouter();
  async function refund(){if(!confirm("Refund this payment and cancel its subscription?"))return;setPending(true);setError("");try{const response=await fetch(`/api/admin/gyms/${gymId}/payments/${paymentId}/refund`,{method:"POST"});const data=await response.json();if(!response.ok){setError(data.error||"Refund failed.");return}router.refresh()}finally{setPending(false)}}
  return <div className="admin-refund-action"><button disabled={pending} onClick={refund}>{pending?"Refunding…":"Refund"}</button>{error&&<small>{error}</small>}</div>;
}
