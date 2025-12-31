import { getSubAndGainErrorDetails } from "./error-handler";
import { toast } from "@/hooks/use-toast";

/**
 * Handles service errors and displays appropriate toast notifications
 * @param error - The error object or string
 * @param defaultTitle - Default title to use if error code can't be mapped
 */
export function handleServiceError(error: any, defaultTitle = "Service Error") {
  // Extract error code if available
  const errorMessage = error?.message || String(error);
  const errorCode = error?.code || 
                   (errorMessage.includes("ERR2") ? errorMessage.match(/ERR2\d{2}/)?.[0] : null);
  
  if (errorCode) {
    // Use the centralized error handler to get user-friendly messages
    const errorDetails = getSubAndGainErrorDetails(errorCode);
    toast({
      title: errorDetails.title,
      description: errorDetails.description,
      variant: "destructive"
    });
  } else {
    // Fallback for unknown errors
    toast({
      title: defaultTitle,
      description: errorMessage,
      variant: "destructive"
    });
  }
}