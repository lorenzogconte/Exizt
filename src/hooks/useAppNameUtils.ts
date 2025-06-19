export function useAppNameUtils() {
  
  const formatUsageTime = (timeInMillis: number): string => {
    if (timeInMillis < 1000) {
      return '< 1s'; // Less than a second
    }
    
    const seconds = Math.floor(timeInMillis / 1000);
    
    if (seconds < 60) {
      // If less than a minute, show seconds
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 60) {
      // If less than an hour, show minutes
      return `${minutes}m`;
    }
    
    // For an hour or more, show hours and minutes
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  return {
    formatUsageTime
  };
}