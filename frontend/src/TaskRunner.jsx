import { useState } from "react";
import { computeCMS } from "../engine";

export default function TaskRunner({ onComplete }) {
  const [data, setData] = useState({});

  function update(partial) {
    const next = { ...data, ...partial };
    setData(next);

    // check if complete
    if (
      next.leftROM &&
      next.rightROM &&
      next.avgTimeSec &&
      next.sway
    ) {
      const result = computeCMS(next);
      onComplete(result);
    }
  }

  return null;
}