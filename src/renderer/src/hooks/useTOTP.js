import { useEffect, useMemo, useState } from 'react'
import { generateTOTP, getSecondsRemaining } from '../utils/otp'

export function useTOTP(account) {
  const [tick, setTick] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  return useMemo(() => {
    const period = account.period || 30
    return {
      code: generateTOTP(account),
      secondsRemaining: getSecondsRemaining(period),
      period,
      now: tick
    }
  }, [account, tick])
}
