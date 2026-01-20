'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react";

function page() {
  const router =  useRouter()
  useEffect(() => {
    localStorage.clear();
router.push("/Login")  
}, []);
  
  return (
    <div>
      Enter
    </div>
  );
}

export default page;