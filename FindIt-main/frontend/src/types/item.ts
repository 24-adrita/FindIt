export type ReportType = "lost" | "found";

export type ItemCategory =
  | "electronics"
  | "id_cards"
  | "keys"
  | "bags_wallets"
  | "clothing"
  | "books_notes"
  | "bottles_accessories"
  | "other";

export interface CampusLocation {
  id: string;
  name: string;
  zone: string;
  lat?: number;
  lng?: number;
}

export interface UploadedImage {
  id: string;
  name: string;
  size: number;
  previewUrl: string;
  file?: File;
}

export interface ItemReportFormData {
  reportType: ReportType;
  title: string;
  category: ItemCategory;
  brand: string;
  primaryColor: string;
  secondaryColor: string;
  campusLocation: string;
  specificLocation: string;
  dateTime: string;
  description: string;
  uniqueMarks: string;
  secretVerificationHint: string;
  reporterName: string;
  studentId: string;
  contactEmail: string;
  contactPhone: string;
  images: UploadedImage[];
}

export interface StoredItemReport {
  id: string;
  _id?: string;
  type?: ReportType;
  reportType: ReportType;
  title: string;
  category: ItemCategory;
  brand: string;
  primaryColor: string;
  secondaryColor: string;
  campusLocation: string;
  specificLocation: string;
  location?: {
    campusZone: string;
    specificLocation: string;
  };
  dateTime: string;
  description: string;
  uniqueMarks?: string;
  secretVerificationHint?: string;
  secretVerificationDetail?: string;
  reporterName?: string;
  submitterName?: string;
  studentId?: string;
  submitterStudentId?: string;
  contactEmail?: string;
  submitterEmail?: string;
  contactPhone?: string;
  submitterPhone?: string;
  images: UploadedImage[];
  imageUrls?: string[];
  imagePaths?: string[];
  createdAt: string;
  updatedAt?: string;
  status: "open" | "active" | "under_review" | "matched" | "claimed" | "resolved";
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  // Sylhet Metropolitan City Hubs
  { id: "syl_zinda", name: "Zindabazar Commercial Center (Al-Hamra / Blue Water)", zone: "Sylhet City Center", lat: 24.8949, lng: 91.8687 },
  { id: "syl_amber", name: "Amberkhana Point & Transit Hub", zone: "Sylhet North Hub", lat: 24.9037, lng: 91.8706 },
  { id: "syl_bandar", name: "Bandarbazar & Court Point (Keane Bridge / Surma)", zone: "Old Sylhet & Riverfront", lat: 24.8898, lng: 91.8690 },
  { id: "syl_rail_bus", name: "Kadamtali Bus Terminal & Sylhet Railway Station", zone: "South Sylhet Transit", lat: 24.8770, lng: 91.8715 },
  { id: "syl_shibganj", name: "Shibganj & Tilagarh (MC College Area)", zone: "East Sylhet", lat: 24.8990, lng: 91.9050 },
  { id: "syl_sust", name: "Kumargaon / SUST Campus Hub", zone: "Northwest Sylhet", lat: 24.9172, lng: 91.8319 },
  { id: "syl_mu", name: "Bateshwar / Metropolitan University Campus", zone: "East Sylhet Suburb", lat: 24.8988, lng: 91.9715 },
  { id: "syl_upashahar", name: "Shahjalal Upashahar Main Road", zone: "Sylhet Residential Hub", lat: 24.8870, lng: 91.8850 },
  { id: "syl_osmani_med", name: "MAG Osmani Medical College & Hospital", zone: "Medical Core", lat: 24.8980, lng: 91.8540 },
  { id: "syl_dargah", name: "Hazrat Shah Jalal Dargah Sharif", zone: "Historic Core", lat: 24.9015, lng: 91.8720 },
  { id: "syl_airport", name: "Osmani International Airport (ZIA)", zone: "Sylhet North Perimeter", lat: 24.9632, lng: 91.8714 },

  // Campus Core Landmarks
  { id: "lib_main", name: "Central University Library", zone: "Academic Core", lat: 24.8988, lng: 91.9715 },
  { id: "sci_eng", name: "Science & Engineering Complex", zone: "North Campus", lat: 24.8995, lng: 91.9710 },
  { id: "stu_union", name: "Student Union & Activity Center", zone: "Central Campus", lat: 24.8985, lng: 91.9720 },
  { id: "dining_hall", name: "Campus Cafeteria & Dining Hall", zone: "Central Campus", lat: 24.8980, lng: 91.9718 },
  { id: "sports_rec", name: "Sports & Recreation Center", zone: "South Campus", lat: 24.8975, lng: 91.9708 },
  { id: "dorm_east", name: "East Campus Residence Halls", zone: "Residential East", lat: 24.8990, lng: 91.9730 },
  { id: "dorm_west", name: "West Campus Residence Halls", zone: "Residential West", lat: 24.8992, lng: 91.9700 },
  { id: "auditorium", name: "Grand Auditorium & Hall A-C", zone: "Arts & Humanities", lat: 24.8982, lng: 91.9725 },
  { id: "admin_bldg", name: "Administration & Registrar Building", zone: "Central Campus", lat: 24.8987, lng: 91.9705 },
  { id: "bus_stop", name: "Campus Shuttle Terminal / Bus Stop", zone: "Transit", lat: 24.8978, lng: 91.9735 },
  { id: "other", name: "Other Sylhet / Metropolitan Location", zone: "Greater Sylhet", lat: 24.8949, lng: 91.8687 },
];

export const ITEM_CATEGORIES: { id: ItemCategory; label: string; icon: string }[] = [
  { id: "electronics", label: "Electronics (Laptops, Phones, Earbuds)", icon: "Laptop" },
  { id: "id_cards", label: "Student IDs, Cards & Documents", icon: "CreditCard" },
  { id: "keys", label: "Keys & Keychains", icon: "Key" },
  { id: "bags_wallets", label: "Backpacks, Purses & Wallets", icon: "Briefcase" },
  { id: "clothing", label: "Clothing, Jackets & Hats", icon: "Shirt" },
  { id: "books_notes", label: "Textbooks, Notebooks & Stationary", icon: "BookOpen" },
  { id: "bottles_accessories", label: "Water Bottles, Umbrellas & Glasses", icon: "Coffee" },
  { id: "other", label: "Other Miscellaneous Items", icon: "HelpCircle" },
];

export const COMMON_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#ffffff" },
  { name: "Silver / Grey", hex: "#94a3b8" },
  { name: "Blue / Navy", hex: "#2563eb" },
  { name: "Red / Burgundy", hex: "#dc2626" },
  { name: "Green", hex: "#16a34a" },
  { name: "Yellow / Gold", hex: "#eab308" },
  { name: "Brown / Tan", hex: "#854d0e" },
  { name: "Purple / Pink", hex: "#c026d3" },
  { name: "Orange", hex: "#ea580c" },
];

export interface MatchCandidate {
  itemId: string;
  title: string;
  category: string;
  brand: string;
  primaryColor: string;
  campusZone: string;
  specificLocation: string;
  dateTime: string;
  imageUrls: string[];
  matchScore: number;
  matchScoreNormalized: number;
  scoreBreakdown: {
    visual: number | null;
    textual: number | null;
    location: number | null;
    time: number | null;
    attribute: number | null;
  };
  effectiveWeights: { [key: string]: number };
  availableModalities: string[];
  unavailableModalities: string[];
  explanation: string;
  subScores?: { [key: string]: number | null };
  visualCues?: string[];
  textualCues?: string[];
  topKeywordsShared?: string[];
  humanVerificationGuidance?: string;
  status: string;
  verificationNotice: string;
}

export interface MatchResponse {
  success: boolean;
  sourceItemId: string;
  sourceItemTitle: string;
  totalCandidatesEvaluated: number;
  matchesReturned?: number;
  matches: MatchCandidate[];
  message?: string;
}

// ==========================================
// Day 4: Authentication & Claims Interfaces
// ==========================================

export type UserRole = "student" | "admin";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserProfile;
}

export type ClaimStatus = "pending" | "approved" | "rejected";

export interface Claim {
  _id: string;
  claimantId: UserProfile | string;
  itemId: StoredItemReport | string;
  secretVerificationAnswer: string;
  proofDetails: string;
  status: ClaimStatus;
  reviewedBy?: UserProfile | string | null;
  reviewedAt?: string | null;
  reviewNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateClaimPayload {
  itemId: string;
  secretVerificationAnswer: string;
  proofDetails: string;
}

// ==========================================
// Day 5: Notification Interfaces
// ==========================================

export type NotificationType = "match_alert" | "claim_approved" | "claim_rejected" | "system";

export interface NotificationItem {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedItemId?: StoredItemReport | string | null;
  relatedClaimId?: Claim | string | null;
  matchScore?: number | null;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationsResponse {
  success: boolean;
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  data: NotificationItem[];
}

