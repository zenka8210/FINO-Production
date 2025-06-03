'use client'
import { useState } from "react";
import page from '../state/state.module.css'
export default function QuantityControl() {
    const [count, setCount] = useState(1);
    const dec = () => {
        setCount(count-1);
    }
    return (
        <div className={page.color}>
        <div>
            <div><button onClick={dec}>-</button>
            {count}
            <button onClick={() => {setCount(count + 1)}}>+</button>
        </div>
        </div>
        </div>
    )
}