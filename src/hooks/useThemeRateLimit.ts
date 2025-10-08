import { useState, useRef, useEffect } from 'react';

export function useThemeRateLimit() {
  const [switchCount, setSwitchCount] = useState(0);
  const [lastSwitchTime, setLastSwitchTime] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState(0);
  const [remainingCooldownTime, setRemainingCooldownTime] = useState(0);
  const switchTimestamps = useRef<number[]>([]);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Check if user has exceeded rate limit (4+ switches in 1 minute)
  const checkRateLimit = () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // 1 minute ago
    
    // Clean up old timestamps
    switchTimestamps.current = switchTimestamps.current.filter(time => time > oneMinuteAgo);
    
    return switchTimestamps.current.length >= 4;
  };

  const canSwitch = (): { allowed: boolean; reason?: string; waitTime?: number } => {
    const now = Date.now();
    
    // If in cooldown mode
    if (isCooldownActive) {
      const remainingTime = Math.ceil((cooldownEndTime - now) / 1000);
      return { 
        allowed: false, 
        reason: `Cooldown: ${remainingTime}s remaining`,
        waitTime: remainingTime * 1000
      };
    }
    
    // If clicked too soon (within 1 second)
    if (now - lastSwitchTime < 1000) {
      const remainingTime = Math.ceil((1000 - (now - lastSwitchTime)) / 100) / 10;
      return { 
        allowed: false, 
        reason: `Wait ${remainingTime}s between switches`,
        waitTime: 1000 - (now - lastSwitchTime)
      };
    }
    
    // Check if this would exceed the rate limit
    if (checkRateLimit()) {
      return { 
        allowed: false, 
        reason: "Too many switches! Activating 60s cooldown"
      };
    }
    
    return { allowed: true };
  };

  const recordSwitch = (onCooldownStart?: (remainingTime: number) => void) => {
    const now = Date.now();
    
    // Check if this switch triggers cooldown
    if (checkRateLimit()) {
      // Activate 1-minute cooldown
      setIsCooldownActive(true);
      const cooldownEnd = now + 60000; // 1 minute from now
      setCooldownEndTime(cooldownEnd);
      setRemainingCooldownTime(60);
      
      onCooldownStart?.(60);
      
      // Start countdown timer
      countdownIntervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const remaining = Math.ceil((cooldownEnd - currentTime) / 1000);
        setRemainingCooldownTime(remaining);
        
        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
        }
      }, 1000);
      
      // Set timeout to clear cooldown
      cooldownTimeoutRef.current = setTimeout(() => {
        setIsCooldownActive(false);
        switchTimestamps.current = []; // Clear timestamps
        setCooldownEndTime(0);
        setRemainingCooldownTime(0);
        
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      }, 60000);
      
      return;
    }
    
    // Record this switch attempt
    switchTimestamps.current.push(now);
    setLastSwitchTime(now);
    setSwitchCount(prev => prev + 1);
  };

  const handleRateLimitViolation = () => {
    const now = Date.now();
    
    // If clicked too soon, set rate limited flag
    if (now - lastSwitchTime < 1000) {
      setIsRateLimited(true);
      
      // Clear rate limit after the remaining time
      setTimeout(() => {
        setIsRateLimited(false);
      }, 1000 - (now - lastSwitchTime));
    }
  };

  return {
    canSwitch,
    recordSwitch,
    handleRateLimitViolation,
    isRateLimited,
    isCooldownActive,
    remainingCooldownTime,
    switchCount
  };
}
