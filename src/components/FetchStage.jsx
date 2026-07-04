import { useEffect } from "react";

export default function FetchStage({ instruction, onComplete }) {
  useEffect(() => {
    // Missing code block: Auto forwards straight to Decode for now!
    onComplete();
  }, [instruction]);

  return <div>[FETCHING HARDWARE SIGNALS...]</div>;
}