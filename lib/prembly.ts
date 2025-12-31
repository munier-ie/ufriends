/**
 * Prembly API Client
 * Documentation: https://docs.prembly.com/docs/welcome-to-prembly-documentation
 */

const PREMBLY_BASE_URL = process.env.PREMBLY_BASE_URL || 'https://api.prembly.com';

interface PremblyConfig {
  apiKey: string;
  appId: string;
}

interface PremblyResponse<T> {
  status: boolean;
  detail: string;
  data?: T;
  error?: string;
}

// NIN Service Types
interface NINPrintoutParams {
  nin: string;
}

interface NINSlipParams {
  nin: string;
}

interface NINAdvancedParams {
  nin: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
}

// BVN Service Types
interface BVNPrintoutParams {
  bvn: string;
}

interface BVNByPhoneParams {
  phoneNumber: string;
}

interface BVNAdvancedParams {
  bvn: string;
}

// Phone number advanced
interface PhoneAdvancedParams {
  phoneNumber: string;
}

// TIN Service Types
interface TINVerificationParams {
  tin: string;
}

// Driver's License
interface DriversLicenseAdvancedParams {
  licenseNumber?: string;
  expiryDate?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
}

// Voters Card
interface VotersCardParams {
  number: string;
  lastName?: string;
  firstName?: string;
  dob?: string;
  lga?: string;
  state?: string;
}

// CAC Service Types (Advance)
interface CACAdvanceParams {
  // unified params aligning to Prembly Advance CAC
  number: string; // RC or BN or IT number
  companyType?: 'RC' | 'BN' | 'IT';
  companyName?: string;
}

// International Passport
interface InternationalPassportV2Params {
  passportNumber: string;
  lastName?: string;
}

// Plate Number
interface PlateNumberParams {
  plateNumber: string;
}

/**
 * Prembly API Client for identity verification services
 */
export class PremblyClient {
  private apiKey: string;
  private appId: string;
  
  constructor(config: PremblyConfig) {
    this.apiKey = config.apiKey;
    this.appId = config.appId;
  }

  private async makeRequest<T>(endpoint: string, method: string, data?: any): Promise<PremblyResponse<T>> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Prembly] env check', {
          baseUrl: PREMBLY_BASE_URL,
          endpoint,
          hasApiKey: !!this.apiKey,
          hasAppId: !!this.appId,
        })
      }
      const response = await fetch(`${PREMBLY_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': this.apiKey,
          'app-id': this.appId,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const contentType = response.headers.get('content-type') || '';
      let result: any;
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Unexpected response from Prembly (${response.status}): ${text.slice(0, 200)}...`);
      }
      
      if (!response.ok) {
        const msg = typeof result?.error === 'string' ? result.error
          : typeof result?.detail === 'string' ? result.detail
          : typeof result?.message === 'string' ? result.message
          : 'Failed to process request';
        throw new Error(msg);
      }
      
      return result;
    } catch (error: any) {
      console.error('Prembly API Error:', error);
      return {
        status: false,
        detail: error.message || 'An error occurred while processing your request',
        error: error.message,
      };
    }
  }

  // NIN Services
  async getNINPrintout(params: NINPrintoutParams) {
    const payload: any = { number_nin: params.nin }
    return this.makeRequest('/verification/vnin', 'POST', payload);
  }

  async getNINSlip(params: NINSlipParams) {
    const payload: any = { number_nin: params.nin }
    return this.makeRequest('/verification/vnin', 'POST', payload);
  }

  async getNINAdvanced(params: NINAdvancedParams) {
    const payload: any = { number_nin: params.nin }
    if (params.phoneNumber) payload.phone_number = params.phoneNumber
    if (params.firstName) payload.first_name = params.firstName
    if (params.lastName) payload.last_name = params.lastName
    if (params.dateOfBirth) payload.date_of_birth = params.dateOfBirth
    if (params.gender) payload.gender = params.gender
    return this.makeRequest('/verification/vnin', 'POST', payload)
  }

  // BVN Services (use documented endpoints)
  async getBVNPrintout(params: BVNPrintoutParams) {
    const payload = { number: params.bvn } as any
    return this.makeRequest('/verification/bvn', 'POST', payload);
  }

  async getBVNByPhone(params: BVNByPhoneParams) {
    // Per docs: POST /verification/bvn_with_phone_advance with payload { phone_number }
    const payload = { phone_number: params.phoneNumber } as any;
    return this.makeRequest('/verification/bvn_with_phone_advance', 'POST', payload);
  }

  async getBVNAdvanced(params: BVNAdvancedParams) {
    return this.makeRequest('/verification/bvn/advance', 'POST', params);
  }

  // Phone Number (Advanced)
  async verifyPhoneAdvanced(params: PhoneAdvancedParams) {
    const payload = { phone_number: params.phoneNumber } as any
    return this.makeRequest('/verification/phone_number/advance', 'POST', payload)
  }

  // TIN
  async verifyTIN(params: TINVerificationParams) {
    return this.makeRequest('/verification/global/tin-check', 'POST', params);
  }

  // Driver's License (Advanced)
  async verifyDriversLicenseAdvanced(params: DriversLicenseAdvancedParams) {
    const payload: any = {}
    if (params.licenseNumber) payload.license_number = params.licenseNumber
    if (params.expiryDate) payload.expiry_date = params.expiryDate
    if (params.firstName) payload.first_name = params.firstName
    if (params.lastName) payload.last_name = params.lastName
    if (params.dob) payload.dob = params.dob
    return this.makeRequest('/verification/drivers_license/advance/v2', 'POST', payload)
  }

  // Voters Card
  async verifyVotersCard(params: VotersCardParams) {
    const payload: any = { number: params.number }
    if (params.lastName) payload.last_name = params.lastName
    if (params.firstName) payload.first_name = params.firstName
    if (params.dob) payload.dob = params.dob
    if (params.lga) payload.lga = params.lga
    if (params.state) payload.state = params.state
    return this.makeRequest('/verification/voters_card', 'POST', payload)
  }

  // CAC Services (Advance)
  async getCACInfo(params: CACAdvanceParams) {
    // Docs: POST /verification/cac/advance with rc_number, company_type, company_name
    const payload: any = {}
    if (params.number) payload.rc_number = String(params.number)
    if (params.companyType) payload.company_type = String(params.companyType)
    if (params.companyName) payload.company_name = String(params.companyName)
    return this.makeRequest('/verification/cac/advance', 'POST', payload)
  }

  async getCACAdvanced(params: CACAdvanceParams) {
    const payload: any = {}
    if (params.number) payload.rc_number = String(params.number)
    if (params.companyType) payload.company_type = String(params.companyType)
    if (params.companyName) payload.company_name = String(params.companyName)
    return this.makeRequest('/verification/cac/advance', 'POST', payload)
  }

  async getCACStatusReport(params: CACAdvanceParams) {
    const payload: any = {}
    if (params.number) payload.rc_number = String(params.number)
    if (params.companyType) payload.company_type = String(params.companyType)
    if (params.companyName) payload.company_name = String(params.companyName)
    return this.makeRequest('/verification/cac/advance', 'POST', payload)
  }

  // International Passport v2
  async verifyInternationalPassportV2(params: InternationalPassportV2Params) {
    const payload: any = { passport_number: params.passportNumber }
    if (params.lastName) payload.last_name = params.lastName
    return this.makeRequest('/verification/national_passport_v2', 'POST', payload)
  }

  // Plate Number
  async verifyPlateNumber(params: PlateNumberParams) {
    const payload = { plate_number: params.plateNumber } as any
    return this.makeRequest('/verification/vehicle', 'POST', payload)
  }
}

// Create and export a singleton instance with environment variables
export const premblyClient = new PremblyClient({
  apiKey: process.env.PREMBLY_API_KEY || '',
  appId: process.env.PREMBLY_APP_ID || '',
});

export default premblyClient;
