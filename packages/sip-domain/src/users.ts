import type { SipUser } from "./types";

// Mock user roster for the SIP admin prototype.
export const sipUsers: SipUser[] = [
  {
    id: "usr-001",
    name: "Nur Azizah",
    role: "pengurus",
    phone: "0812-3100-2188",
    region: "SIP Center",
    status: "Aktif",
  },
  {
    id: "usr-002",
    name: "Fikri Ramadhan",
    role: "admin",
    phone: "0813-8821-4409",
    region: "SIP Center",
    status: "Aktif",
  },
  {
    id: "usr-003",
    name: "Ahmad Ridwan",
    role: "verifikator",
    phone: "0857-7720-1199",
    region: "Bekasi",
    status: "Aktif",
  },
  {
    id: "usr-004",
    name: "Dewi Lestari",
    role: "verifikator",
    phone: "0821-1902-5521",
    region: "Bogor",
    status: "Aktif",
  },
  {
    id: "usr-005",
    name: "Haris Maulana",
    role: "verifikator",
    phone: "0812-6444-9012",
    region: "Jakarta Timur",
    status: "Aktif",
  },
];
