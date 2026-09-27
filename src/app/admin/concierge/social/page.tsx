"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Share2,
  ExternalLink,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  Mail,
  Download,
  Star,
  Link,
} from "lucide-react";

// --- Types ---

interface GroupData {
  name: string;
  url: string;
  city: string;
}

interface PostTracker {
  [groupUrl: string]: string; // ISO date string
}

type FilterTab = "all" | "due" | "never";

// --- Constants ---

const STORAGE_KEY = "social-post-tracker";
const REPOST_DAYS = 14;

const SWEETLEASE_GROUP_URL = "https://www.facebook.com/groups/949816451005596/";
const SWEETLEASE_GROUP_SHORT = "facebook.com/groups/949816451005596";

const CITY_COLORS: Record<string, { bg: string; text: string }> = {
  Cleveland: { bg: "bg-blue-100", text: "text-blue-700" },
  Miami: { bg: "bg-pink-100", text: "text-pink-700" },
  Pittsburgh: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Nashville: { bg: "bg-purple-100", text: "text-purple-700" },
  Boston: { bg: "bg-red-100", text: "text-red-700" },
  Houston: { bg: "bg-green-100", text: "text-green-700" },
  National: { bg: "bg-gray-100", text: "text-gray-700" },
  NYC: { bg: "bg-orange-100", text: "text-orange-700" },
  Baltimore: { bg: "bg-indigo-100", text: "text-indigo-700" },
 "Los Angeles": { bg: "bg-sky-100", text: "text-sky-700" },
 "San Francisco": { bg: "bg-teal-100", text: "text-teal-700" },
 "Ann Arbor": { bg: "bg-amber-100", text: "text-amber-700" },
  Durham: { bg: "bg-violet-100", text: "text-violet-700" },
  Philadelphia: { bg: "bg-rose-100", text: "text-rose-700" },
  Chicago: { bg: "bg-cyan-100", text: "text-cyan-700" },
  Atlanta: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Seattle: { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  Dallas: { bg: "bg-lime-100", text: "text-lime-700" },
 "Rochester MN": { bg: "bg-stone-100", text: "text-stone-700" },
  Indianapolis: { bg: "bg-zinc-100", text: "text-zinc-700" },
  Birmingham: { bg: "bg-red-100", text: "text-red-700" },
  Cincinnati: { bg: "bg-orange-100", text: "text-orange-700" },
  Minneapolis: { bg: "bg-blue-100", text: "text-blue-700" },
  Charleston: { bg: "bg-green-100", text: "text-green-700" },
 "New Orleans": { bg: "bg-purple-100", text: "text-purple-700" },
  Madison: { bg: "bg-pink-100", text: "text-pink-700" },
  Denver: { bg: "bg-sky-100", text: "text-sky-700" },
  Gainesville: { bg: "bg-orange-100", text: "text-orange-700" },
 "Chapel Hill": { bg: "bg-blue-100", text: "text-blue-700" },
  Charlottesville: { bg: "bg-indigo-100", text: "text-indigo-700" },
 "Iowa City": { bg: "bg-amber-100", text: "text-amber-700" },
  Lexington: { bg: "bg-cyan-100", text: "text-cyan-700" },
  Tampa: { bg: "bg-emerald-100", text: "text-emerald-700" },
 "Kansas City": { bg: "bg-violet-100", text: "text-violet-700" },
  Omaha: { bg: "bg-rose-100", text: "text-rose-700" },
  Memphis: { bg: "bg-teal-100", text: "text-teal-700" },
 "Rochester NY": { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
 "Washington DC": { bg: "bg-lime-100", text: "text-lime-700" },
  Detroit: { bg: "bg-stone-100", text: "text-stone-700" },
 "Winston-Salem": { bg: "bg-zinc-100", text: "text-zinc-700" },
 "Danville PA": { bg: "bg-slate-100", text: "text-slate-700" },
 "Travel Nurse": { bg: "bg-red-100", text: "text-red-700" },
  Medical: { bg: "bg-emerald-100", text: "text-emerald-700" },
 "East Tennessee": { bg: "bg-amber-100", text: "text-amber-700" },
  Connecticut: { bg: "bg-indigo-100", text: "text-indigo-700" },
  Oakland: { bg: "bg-stone-100", text: "text-stone-700" },
  Florida: { bg: "bg-orange-100", text: "text-orange-700" },
 "New Haven": { bg: "bg-blue-100", text: "text-blue-700" },
  Albany: { bg: "bg-purple-100", text: "text-purple-700" },
 "Burlington VT": { bg: "bg-green-100", text: "text-green-700" },
  Richmond: { bg: "bg-red-100", text: "text-red-700" },
 "Columbus OH": { bg: "bg-rose-100", text: "text-rose-700" },
 "St. Louis": { bg: "bg-sky-100", text: "text-sky-700" },
  Milwaukee: { bg: "bg-amber-100", text: "text-amber-700" },
 "East Lansing": { bg: "bg-green-100", text: "text-green-700" },
  Orlando: { bg: "bg-orange-100", text: "text-orange-700" },
  Louisville: { bg: "bg-red-100", text: "text-red-700" },
  Sacramento: { bg: "bg-yellow-100", text: "text-yellow-700" },
 "San Antonio": { bg: "bg-teal-100", text: "text-teal-700" },
  Austin: { bg: "bg-violet-100", text: "text-violet-700" },
 "San Diego": { bg: "bg-cyan-100", text: "text-cyan-700" },
  Irvine: { bg: "bg-blue-100", text: "text-blue-700" },
  Portland: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Tucson: { bg: "bg-orange-100", text: "text-orange-700" },
 "Salt Lake City": { bg: "bg-sky-100", text: "text-sky-700" },
  Albuquerque: { bg: "bg-rose-100", text: "text-rose-700" },
 "Oklahoma City": { bg: "bg-red-100", text: "text-red-700" },
  Galveston: { bg: "bg-teal-100", text: "text-teal-700" },
  Aurora: { bg: "bg-indigo-100", text: "text-indigo-700" },
  Toledo: { bg: "bg-amber-100", text: "text-amber-700" },
 "Loma Linda": { bg: "bg-purple-100", text: "text-purple-700" },
  Tallahassee: { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  Augusta: { bg: "bg-lime-100", text: "text-lime-700" },
 "Columbia SC": { bg: "bg-green-100", text: "text-green-700" },
};

const GROUPS: GroupData[] = [
  // Cleveland
  { name: "Cleveland Clinic Student Housing", url: "https://facebook.com/groups/CCStudentHousing/", city: "Cleveland" },
  { name: "Columbus Housing, Rooms, Apartments", url: "https://facebook.com/groups/809396252462237/", city: "Cleveland" },
  { name: "OSU Off Campus Housing", url: "https://facebook.com/groups/1470715312973587/", city: "Cleveland" },
  // Miami
  { name: "UM Housing & Roommates", url: "https://facebook.com/groups/433378197122432/", city: "Miami" },
  { name: "UM Off Campus Rooms", url: "https://facebook.com/groups/405298067655451/", city: "Miami" },
  // Pittsburgh
  { name: "Pitt & CMU Housing Subleases", url: "https://facebook.com/groups/PittSubleasesRoommates/", city: "Pittsburgh" },
  { name: "Pittsburgh Housing, Rooms, Apartments", url: "https://facebook.com/groups/214878512490890/", city: "Pittsburgh" },
  { name: "Pitt Housing, Sublets & Roommates", url: "https://facebook.com/groups/816037598451517/", city: "Pittsburgh" },
  // Nashville
  { name: "Housing near Vanderbilt", url: "https://facebook.com/groups/1457647111194961/", city: "Nashville" },
  { name: "Vanderbilt Apartments and Housing", url: "https://facebook.com/groups/vanderbilt.apartments/", city: "Nashville" },
  { name: "Nashville Housing", url: "https://facebook.com/groups/963043180392901/", city: "Nashville" },
  { name: "Vanderbilt University Housing Room Rental", url: "https://facebook.com/groups/vanderbilt.university.housing.nashville.rentals/", city: "Nashville" },
  // Boston
  { name: "MGH Housing, Rooms", url: "https://facebook.com/groups/massgeneralhospital/", city: "Boston" },
  { name: "Boston Housing", url: "https://facebook.com/groups/1566296393687929/", city: "Boston" },
  { name: "Boston Student Housing", url: "https://facebook.com/groups/352407375245793/", city: "Boston" },
  { name: "Cambridge MA Housing", url: "https://facebook.com/groups/321849372127744/", city: "Boston" },
  { name: "Harvard Housing", url: "https://facebook.com/groups/harvardhousing/", city: "Boston" },
  // Houston
  { name: "UTH Housing", url: "https://facebook.com/groups/262902437128663/", city: "Houston" },
  { name: "Houston Medical Center", url: "https://facebook.com/groups/233850040126034/", city: "Houston" },
  // National
  { name: "USMLE Residency Match", url: "https://facebook.com/groups/437428600378395/", city: "National" },
  { name: "MedsHousing", url: "https://facebook.com/MedsHousing/", city: "National" },
  { name: "Student Doctor Network", url: "https://facebook.com/studentdoctor/", city: "National" },
  // NYC
  { name: "Columbia University Housing", url: "https://facebook.com/groups/ColumbiaUniversityHousing/", city: "NYC" },
  { name: "Sinai Student Housing - ISMMS", url: "https://facebook.com/groups/sinaistudenthousing/", city: "NYC" },
  { name: "NYU Housing/Sublets/Rentals", url: "https://facebook.com/groups/NYUHousingSubletsRentals/", city: "NYC" },
  { name: "Gypsy Housing New York", url: "https://facebook.com/groups/NewYorkARS/", city: "NYC" },
  { name: "NYC Brooklyn Housing", url: "https://facebook.com/groups/2050201058584087/", city: "NYC" },
  { name: "New York Medical College Off-Campus", url: "https://facebook.com/groups/379779419121158/", city: "NYC" },
  // Baltimore
  { name: "JHMI Housing - East Baltimore", url: "https://facebook.com/groups/1582913955203310/", city: "Baltimore" },
  { name: "JHU Housing, Sublets & Roommates", url: "https://facebook.com/groups/jhuhousing/", city: "Baltimore" },
  { name: "UMB Housing, Sublets", url: "https://facebook.com/groups/umbhousing/", city: "Baltimore" },
  { name: "JHU Housing Roommates Tenants", url: "https://facebook.com/groups/679460939611131/", city: "Baltimore" },
  // Los Angeles
  { name: "UCLA Housing, Rooms, Apartments", url: "https://facebook.com/groups/415336998925847/", city: "Los Angeles" },
  { name: "Cedars-Sinai Housing/Rentals", url: "https://facebook.com/groups/377936620032639/", city: "Los Angeles" },
  { name: "UCLA Off-Campus Housing", url: "https://facebook.com/groups/1835635240040670/", city: "Los Angeles" },
  { name: "UCLA Alumni/Graduate Apartments", url: "https://facebook.com/groups/1738314459771399/", city: "Los Angeles" },
  // San Francisco
  { name: "UCSF Student Housing", url: "https://facebook.com/groups/apartments.ucsanfrancisco/", city: "San Francisco" },
  { name: "UCSF Off-Campus Housing", url: "https://facebook.com/groups/ucsfhousing/", city: "San Francisco" },
  { name: "Stanford University Housing", url: "https://facebook.com/groups/stanfordhousing/", city: "San Francisco" },
  { name: "SF Rooms for Rent, UCSF, USF", url: "https://facebook.com/groups/san.francisco.bay.area.rooms.roommates/", city: "San Francisco" },
  { name: "Stanford Off-Campus Housing", url: "https://facebook.com/groups/1831603267114508/", city: "San Francisco" },
  { name: "Stanford Housing Rooms Apartments", url: "https://facebook.com/groups/746424749257725/", city: "San Francisco" },
  // Ann Arbor
  { name: "Student Housing in Ann Arbor", url: "https://facebook.com/groups/14085799663/", city: "Ann Arbor" },
  { name: "UMich Off-Campus Housing", url: "https://facebook.com/groups/1931776477066245/", city: "Ann Arbor" },
  { name: "Ann Arbor Roommates and Housing", url: "https://facebook.com/groups/annarborroommates/", city: "Ann Arbor" },
  // Durham
  { name: "Duke University Housing", url: "https://facebook.com/groups/256677058925606/", city: "Durham" },
  { name: "Duke Off Campus Housing", url: "https://facebook.com/groups/dukeuniversityoffcampushousingroommatesearch/", city: "Durham" },
  { name: "Duke Housing Sublets & Roommates", url: "https://facebook.com/groups/416653745172696/", city: "Durham" },
  { name: "Durham Housing Apartments Rooms", url: "https://facebook.com/groups/796682950436985/", city: "Durham" },
  // Philadelphia
  { name: "UPenn Housing, Sublets & Roommates", url: "https://facebook.com/groups/935981056448770/", city: "Philadelphia" },
  { name: "Thomas Jefferson/Drexel Off-Campus", url: "https://facebook.com/groups/824156272438870/", city: "Philadelphia" },
  { name: "UPenn Student Housing", url: "https://facebook.com/groups/apartments.upenn/", city: "Philadelphia" },
  // Chicago
  { name: "Northwestern Apartments and Housing", url: "https://facebook.com/groups/northwesternhousing/", city: "Chicago" },
  { name: "UChicago Apartments and Housing", url: "https://facebook.com/groups/uchicagohousing/", city: "Chicago" },
  // Atlanta
  { name: "Emory University Apartments and Housing", url: "https://facebook.com/groups/emoryhousing/", city: "Atlanta" },
  { name: "Emory Housing Roommates Tenants", url: "https://facebook.com/groups/257528688885975/", city: "Atlanta" },
  // Seattle
  { name: "UW Housing, Subleases & Roommates", url: "https://facebook.com/groups/UWSubleasesRoommates/", city: "Seattle" },
  { name: "UW Student Housing & Rentals", url: "https://facebook.com/groups/UWRentals/", city: "Seattle" },
  // Dallas
  { name: "UTSW Rental, Housing, Apartment", url: "https://facebook.com/groups/497472708085406/", city: "Dallas" },
  // Rochester MN
  { name: "Rochester MN Rentals, Apartments", url: "https://facebook.com/groups/716574462519336/", city: "Rochester MN" },
  // Indianapolis
  { name: "IUPUI Student Housing", url: "https://facebook.com/groups/apartments.iupui/", city: "Indianapolis" },
  { name: "IU Housing Rooms Apartments", url: "https://facebook.com/groups/179350159474056/", city: "Indianapolis" },
  // Birmingham
  { name: "UAB Housing, Room Rentals", url: "https://facebook.com/groups/birmingham.uab.housing.rentals.alabama/", city: "Birmingham" },
  { name: "Birmingham Alabama Housing", url: "https://facebook.com/groups/420673578417009/", city: "Birmingham" },
  // Cincinnati
  { name: "UC Apartments and Housing", url: "https://facebook.com/groups/cincinnati.housing/", city: "Cincinnati" },
  { name: "UC Off Campus Housing", url: "https://facebook.com/groups/148519802222255/", city: "Cincinnati" },
  { name: "UC Housing Sublets", url: "https://facebook.com/groups/2377322855913395/", city: "Cincinnati" },
  // Minneapolis
  { name: "UMN Graduate Student Housing", url: "https://facebook.com/groups/1765033537090564/", city: "Minneapolis" },
  { name: "UMN Housing & Roommates", url: "https://facebook.com/groups/1364804473579405/", city: "Minneapolis" },
  // Charleston
  { name: "MUSC Roommates in Charleston", url: "https://facebook.com/groups/MUSCROOMMATES/", city: "Charleston" },
  // New Orleans
  { name: "New Orleans Housing, Rooms", url: "https://facebook.com/groups/200135023911082/", city: "New Orleans" },
  // Madison
  { name: "UW-Madison Off Campus Housing", url: "https://facebook.com/groups/universityofwisconsinmadisonoffcampushousingsearch/", city: "Madison" },
  // Denver
  { name: "University of Colorado Denver Housing", url: "https://facebook.com/groups/357047062223298/", city: "Denver" },
  // Gainesville
  { name: "UF Off Campus Housing, Subleases", url: "https://facebook.com/groups/UFSubleasesRoommates/", city: "Gainesville" },
  { name: "UF Housing, Rooms, Apartments", url: "https://facebook.com/groups/153986935222442/", city: "Gainesville" },
  // Chapel Hill
  { name: "UNC Chapel Hill Subleases, Roommates", url: "https://facebook.com/groups/UNCSubleasesRoommates/", city: "Chapel Hill" },
  { name: "UNC Chapel Hill Apartments", url: "https://facebook.com/groups/chapelhillapartments/", city: "Chapel Hill" },
  // Charlottesville
  { name: "UVA Off Campus Housing", url: "https://facebook.com/groups/uvahousing/", city: "Charlottesville" },
  { name: "UVA Apt Sublets, Housing", url: "https://facebook.com/groups/uvahousingroommates/", city: "Charlottesville" },
  // Iowa City
  { name: "University of Iowa Apartments and Housing", url: "https://facebook.com/groups/apartments.iowa/", city: "Iowa City" },
  // Lexington
  { name: "University of Kentucky Apartments and Housing", url: "https://facebook.com/groups/kentuckyhousing/", city: "Lexington" },
  // Tampa
  { name: "USF Apartments and Housing", url: "https://facebook.com/groups/usf.apartments/", city: "Tampa" },
  // Kansas City
  { name: "University of Kansas Housing", url: "https://facebook.com/groups/university.of.kansas.housing.ku.rentals.sublease/", city: "Kansas City" },
  // Omaha
  { name: "University of Nebraska Omaha Housing", url: "https://facebook.com/groups/358291121294169/", city: "Omaha" },
  // Memphis
  { name: "Memphis Student Housing", url: "https://facebook.com/groups/apartments.umemphis/", city: "Memphis" },
  // Rochester NY
  { name: "University of Rochester Housing", url: "https://facebook.com/groups/1112684565415024/", city: "Rochester NY" },
  // Washington DC
  { name: "DC Housing, Rooms, Apartments", url: "https://facebook.com/groups/1468086266815937/", city: "Washington DC" },
  // Detroit
  { name: "Detroit Housing and Roommates", url: "https://facebook.com/groups/detroit.housing.and.roommates/", city: "Detroit" },
  // Winston-Salem
  { name: "Wake Forest University Housing", url: "https://facebook.com/groups/1647508125472529/", city: "Winston-Salem" },
  // Danville PA
  { name: "Geisinger Residents Auxiliary", url: "https://facebook.com/groups/geisingerresaux/", city: "Danville PA" },
  // Additional Houston
  { name: "Houston Rooms and Apartments", url: "https://facebook.com/groups/houstonrooms/", city: "Houston" },
  // Additional Chicago
  { name: "Chicago Housing, Rooms, Apartments", url: "https://facebook.com/groups/chicagohousing/", city: "Chicago" },
  // Additional Seattle
  { name: "Seattle Housing, Rooms, Apartments", url: "https://facebook.com/groups/seattlehousing/", city: "Seattle" },
  // Additional Dallas
  { name: "Dallas Housing, Rooms for Rent", url: "https://facebook.com/groups/dallashousing/", city: "Dallas" },
  // Additional Miami
  { name: "Miami Housing, Rooms, Apartments", url: "https://facebook.com/groups/miamihousing/", city: "Miami" },
  // Additional New Orleans
  { name: "Tulane University Housing", url: "https://facebook.com/groups/tulanehousing/", city: "New Orleans" },
  // Additional Charleston
  { name: "Charleston Housing, Rooms, Apartments", url: "https://facebook.com/groups/charlestonhousing/", city: "Charleston" },
  // Additional Madison
  { name: "Madison WI Housing and Roommates", url: "https://facebook.com/groups/madisonwi.housing/", city: "Madison" },
  // Additional Denver
  { name: "Denver Housing, Rooms, Apartments", url: "https://facebook.com/groups/denverhousing/", city: "Denver" },
  // Additional Washington DC
  { name: "Georgetown University Housing", url: "https://facebook.com/groups/georgetownhousing/", city: "Washington DC" },
  // Additional National
  { name: "Medical Residency Housing Exchange", url: "https://facebook.com/groups/residencyhousing/", city: "National" },
  // --- NEW: Medical-Specific Groups ---
  { name: "Medical Sublets", url: "https://facebook.com/groups/MedicalSublets/", city: "Medical" },
  { name: "Medical Student Rotation Housing", url: "https://facebook.com/groups/1084955423211801/", city: "Medical" },
  { name: "USMLE Residency Match 2026/2027 IMGs", url: "https://facebook.com/groups/409576406099887/", city: "Medical" },
  { name: "PA Students and New Grads", url: "https://facebook.com/groups/PAStudentsandNewGrads/", city: "Medical" },
  { name: "Columbia University Medical Center Sublets", url: "https://facebook.com/groups/1952394528216508/", city: "NYC" },
  { name: "UCHC Housing - Medical Professionals", url: "https://facebook.com/groups/589195334545336/", city: "Connecticut" },
  { name: "ETSU/Quillen Medical Student Housing", url: "https://facebook.com/groups/1534917810700667/", city: "East Tennessee" },
  // --- NEW: Travel Nurse / Healthcare Housing (High Volume) ---
  { name: "Travel Housing - Gypsy Nurses (144K)", url: "https://facebook.com/groups/travelnursehousing/", city: "Travel Nurse" },
  { name: "Travel Nurse Housing USA", url: "https://facebook.com/groups/TravelNurseHousingUSA/", city: "Travel Nurse" },
  { name: "Travel Nurse Housing Rentals by Landlords", url: "https://facebook.com/groups/Travel.Nurse.Landlords/", city: "Travel Nurse" },
  { name: "Furnished Finder Monthly Rentals", url: "https://facebook.com/groups/furnishedfinder.travelnursehousing/", city: "Travel Nurse" },
  { name: "Travel Nurse and Remote Worker Housing", url: "https://facebook.com/groups/temphousing/", city: "Travel Nurse" },
  { name: "Monthly Furnished Housing - Med Pros", url: "https://facebook.com/groups/414305935358576/", city: "Travel Nurse" },
  { name: "Flexible Furnished Rental - Med Pros USA", url: "https://facebook.com/groups/flexiblefurnishedhousingfortravelnursesmedprosusa/", city: "Travel Nurse" },
  { name: "Travel Nurse Housing - Pet Friendly", url: "https://facebook.com/groups/423336735045219/", city: "Travel Nurse" },
  { name: "Gypsy Nurse Network", url: "https://facebook.com/groups/TheGypsyNurseNetwork/", city: "Travel Nurse" },
  // --- NEW: City-Specific Travel Nurse ---
  { name: "Boston Travel Nurses Furnished Housing", url: "https://facebook.com/groups/569576773896827/", city: "Boston" },
  { name: "Seattle Travel Nurses Furnished Rentals", url: "https://facebook.com/groups/furnishedtravel/", city: "Seattle" },
  { name: "Travel Nurse Housing - SF Bay Area", url: "https://facebook.com/groups/2705438979684399/", city: "San Francisco" },
  { name: "Florida Travel Nurse/Medical Housing", url: "https://facebook.com/groups/185260041339600/", city: "Florida" },
  // --- NEW: Additional City Groups ---
  { name: "NYC Housing, Rooms, Apartments, Sublets", url: "https://facebook.com/groups/1225966920763001/", city: "NYC" },
  { name: "NYU Housing, Rooms, Apartments", url: "https://facebook.com/groups/1416151198490459/", city: "NYC" },
  { name: "Boston Housing, Rooms, Apartments", url: "https://facebook.com/groups/673389662794979/", city: "Boston" },
  { name: "LA Housing, Rooms, Apartments", url: "https://facebook.com/groups/1621705121404017/", city: "Los Angeles" },
  { name: "Philadelphia Housing, Rooms, Apartments", url: "https://facebook.com/groups/453686588142698/", city: "Philadelphia" },
  { name: "Minneapolis Housing, Rooms, Apartments", url: "https://facebook.com/groups/439773589790851/", city: "Minneapolis" },
  { name: "Oakland Housing, Rooms, Apartments", url: "https://facebook.com/groups/351534728678089/", city: "Oakland" },
  // --- NEW: Med-School-Specific Groups (highest value) ---
  { name: "GUSOM For Sale & Housing (Georgetown Med)", url: "https://facebook.com/groups/268311666836371/", city: "Washington DC" },
  { name: "MCW Student Housing Forum", url: "https://facebook.com/groups/251243402542476/", city: "Milwaukee" },
  { name: "LMU-DCOM Housing (Osteopathic)", url: "https://facebook.com/groups/418600281894750/", city: "East Tennessee" },
  { name: "UTMB Student Housing & Roommate Forum", url: "https://facebook.com/groups/utmbhousingforum/", city: "Galveston" },
  { name: "Living Near Anschutz (CU Med Campus)", url: "https://facebook.com/groups/1082164362967453/", city: "Aurora" },
  { name: "Anschutz Medical Campus Students", url: "https://facebook.com/groups/1423838631165735/", city: "Aurora" },
  { name: "UC Davis Medical Center Housing", url: "https://facebook.com/groups/249683679083782/", city: "Sacramento" },
  { name: "UT Health Roommates / Housing Finder SA", url: "https://facebook.com/groups/275833972993673/", city: "San Antonio" },
  { name: "Rocky Vista University Housing (DO)", url: "https://facebook.com/groups/1359601104663444/", city: "Aurora" },
  { name: "Midwestern University Housing (DO)", url: "https://facebook.com/groups/464312248661727/", city: "Chicago" },
  { name: "Loma Linda Home Rentals", url: "https://facebook.com/groups/lomalindahomerentals/", city: "Loma Linda" },
  { name: "UCR & Loma Linda Housing", url: "https://facebook.com/groups/938298827783344/", city: "Loma Linda" },
  // --- NEW: Northeast (new cities) ---
  { name: "Albany Student Off Campus Housing", url: "https://facebook.com/groups/221312825264729/", city: "Albany" },
  { name: "Yale Off-Campus Housing", url: "https://facebook.com/groups/yalehousing/", city: "New Haven" },
  { name: "Yale Student Housing & Apartments", url: "https://facebook.com/groups/apartments.yale/", city: "New Haven" },
  { name: "Tufts Off-Campus Housing", url: "https://facebook.com/groups/1262397437215154/", city: "Boston" },
  { name: "UVM Housing, Room Rental, Sublet", url: "https://facebook.com/groups/vermont.uvm.housing.burlington.rentals/", city: "Burlington VT" },
  { name: "BU Housing, Rooms, Apartments", url: "https://facebook.com/groups/684464255694512/", city: "Boston" },
  { name: "Stony Brook Off-Campus Housing", url: "https://facebook.com/groups/sbuoffcampushousing/", city: "NYC" },
  { name: "Cornell Housing, Sublets & Roommates", url: "https://facebook.com/groups/1567221950234112/", city: "NYC" },
  { name: "Drexel Housing, Sublets & Roommates", url: "https://facebook.com/groups/1126607547359578/", city: "Philadelphia" },
  { name: "Penn State Apartments, Sublets", url: "https://facebook.com/groups/184555275349889/", city: "Philadelphia" },
  { name: "Rutgers Newark Apartments", url: "https://facebook.com/groups/apartments.rutgersnewark/", city: "NYC" },
  // --- NEW: Mid-Atlantic / DC ---
  { name: "GWU Housing, Sublets & Roommates", url: "https://facebook.com/groups/gwuhousing/", city: "Washington DC" },
  { name: "Howard University Off Campus Housing", url: "https://facebook.com/groups/howarduniversityhousing/", city: "Washington DC" },
  { name: "VCU Off Campus Housing", url: "https://facebook.com/groups/VCUSubleasesRoommates/", city: "Richmond" },
  { name: "VCU Housing, Sublets", url: "https://facebook.com/groups/1557593587828161/", city: "Richmond" },
  { name: "UMD Baltimore Housing, Sublets", url: "https://facebook.com/groups/1947340111964457/", city: "Baltimore" },
  { name: "WVU Apartments and Housing", url: "https://facebook.com/groups/westvirginiau/", city: "Charleston" },
  { name: "Virginia Tech Housing, Sublets", url: "https://facebook.com/groups/virginiatechhousing/", city: "Charlottesville" },
  // --- NEW: Southeast (new cities) ---
  { name: "FSU Off-Campus Housing & Subleases", url: "https://facebook.com/groups/299577247580116/", city: "Tallahassee" },
  { name: "UCF Housing and Subleases", url: "https://facebook.com/groups/ucfhousingandsubleases/", city: "Orlando" },
  { name: "UCF Housing Moderated", url: "https://facebook.com/groups/UCFHousing/", city: "Orlando" },
  { name: "UofL Housing, Sublets", url: "https://facebook.com/groups/1449203208726729/", city: "Louisville" },
  { name: "UofL Apartments and Housing", url: "https://facebook.com/groups/ulouisville/", city: "Louisville" },
  { name: "Augusta Rentals, Housing, Rooms", url: "https://facebook.com/groups/2282167541996842/", city: "Augusta" },
  { name: "USC Columbia Housing, Sublets", url: "https://facebook.com/groups/uofschousingsubleasesroommates/", city: "Columbia SC" },
  { name: "NSU Housing, Room Rentals (Nova SE)", url: "https://facebook.com/groups/nova.southeastern.housing.nsu.rentals/", city: "Miami" },
  { name: "Mercer University Off-Campus Housing", url: "https://facebook.com/groups/364459032677554/", city: "Atlanta" },
  { name: "CofC and MUSC Off Campus Housing", url: "https://facebook.com/groups/1564910317000364/", city: "Charleston" },
  { name: "Emory & Georgia Tech Subleases", url: "https://facebook.com/groups/EmorySubleasesRoommates/", city: "Atlanta" },
  { name: "FAU Off Campus Housing", url: "https://facebook.com/groups/fausubleasesapartmentsroommates/", city: "Miami" },
  { name: "Liberty University Off-Campus Housing", url: "https://facebook.com/groups/861578711350181/", city: "Charlottesville" },
  // --- NEW: Midwest (new cities) ---
  { name: "Case Western Apartments and Housing", url: "https://facebook.com/groups/caseu/", city: "Cleveland" },
  { name: "Ohio State Housing, Sublets & Roommates", url: "https://facebook.com/groups/379832262202968/", city: "Columbus OH" },
  { name: "OSU Columbus Housing, Rooms, Apartments", url: "https://facebook.com/groups/196003857628784/", city: "Columbus OH" },
  { name: "WashU Housing, Sublets", url: "https://facebook.com/groups/450924321750119/", city: "St. Louis" },
  { name: "WashU Apartments and Housing", url: "https://facebook.com/groups/washingtonstlouis/", city: "St. Louis" },
  { name: "SLU Housing, Sublets & Roommates", url: "https://facebook.com/groups/1578990435708366/", city: "St. Louis" },
  { name: "MSU Housing, Sublets & Roommates", url: "https://facebook.com/groups/1381472642168689/", city: "East Lansing" },
  { name: "MSU Off-Campus Housing", url: "https://facebook.com/groups/267114047031859/", city: "East Lansing" },
  { name: "Wayne State Off-Campus Housing", url: "https://facebook.com/groups/1397778240282664/", city: "Detroit" },
  { name: "IU Housing, Sublets & Roommates", url: "https://facebook.com/groups/907726415914493/", city: "Indianapolis" },
  { name: "Loyola Chicago Housing, Sublets", url: "https://facebook.com/groups/888435001217763/", city: "Chicago" },
  { name: "UIC Housing, Rooms", url: "https://facebook.com/groups/3144810932263925/", city: "Chicago" },
  { name: "U of Toledo Off-Campus Housing", url: "https://facebook.com/groups/835168386563949/", city: "Toledo" },
  { name: "Ohio University Heritage COM Housing", url: "https://facebook.com/groups/383151271869688/", city: "Columbus OH" },
  // --- NEW: South / Texas / Plains ---
  { name: "Texas A&M Student Housing", url: "https://facebook.com/groups/tamu.apartments/", city: "Houston" },
  { name: "UT Austin Housing, Rooms, Apartments", url: "https://facebook.com/groups/1522076437888048/", city: "Austin" },
  { name: "UT Austin Housing, Sublets & Roommates", url: "https://facebook.com/groups/819571114777811/", city: "Austin" },
  { name: "OU Off-Campus Student Housing", url: "https://facebook.com/groups/457164348513299/", city: "Oklahoma City" },
  { name: "NOLA Housing and Roommates", url: "https://facebook.com/groups/new.orleans.housing.and.roommates/", city: "New Orleans" },
  // --- NEW: Mountain West ---
  { name: "University of Utah Housing, Sublets", url: "https://facebook.com/groups/675656609223294/", city: "Salt Lake City" },
  { name: "UNM Housing, Sublets & Roommates", url: "https://facebook.com/groups/341549776055685/", city: "Albuquerque" },
  { name: "University of Arizona Housing", url: "https://facebook.com/groups/universityofarizonahousing/", city: "Tucson" },
  { name: "UNR Housing, Sublets & Roommates", url: "https://facebook.com/groups/1474955982726870/", city: "Tucson" },
  // --- NEW: West Coast / Pacific ---
  { name: "USC Homes (Keck School area)", url: "https://facebook.com/groups/usc.homes/", city: "Los Angeles" },
  { name: "UCLA Graduate Student Housing", url: "https://facebook.com/groups/332091610661275/", city: "Los Angeles" },
  { name: "UC Irvine Housing", url: "https://facebook.com/groups/UCIrvineHousing/", city: "Irvine" },
  { name: "UCSD Student Off-Campus Housing", url: "https://facebook.com/groups/2387457222/", city: "San Diego" },
  { name: "UCSD Student Off-Campus Housing 2.0", url: "https://facebook.com/groups/ucsd.student.off.campus.housing/", city: "San Diego" },
  { name: "UCR Housing / Sublets / Rentals", url: "https://facebook.com/groups/UCRHousing/", city: "Loma Linda" },
  { name: "UC Davis Housing - Grad/Professional", url: "https://facebook.com/groups/286762898448011/", city: "Sacramento" },
  { name: "UW Seattle Housing - Roommates, Sublets", url: "https://facebook.com/groups/UWSeattleHousing/", city: "Seattle" },
  { name: "Stanford Palo Alto Housing, Roommates", url: "https://facebook.com/groups/3995541210514696/", city: "San Francisco" },
  { name: "OHSU School of Medicine Students", url: "https://facebook.com/groups/228714883908836/", city: "Portland" },
];

const CITY_HOSPITALS: Record<string, string> = {
  Cleveland: "Cleveland Clinic, University Hospitals, and MetroHealth",
  Miami: "Jackson Memorial, UM Health, and Baptist Health",
  Pittsburgh: "UPMC, Allegheny Health Network, and VA Pittsburgh",
  Nashville: "Vanderbilt University Medical Center, TriStar, and Saint Thomas",
  Boston: "Mass General, Brigham and Women's, Beth Israel, and Boston Medical Center",
  Houston: "UTHealth, MD Anderson, Memorial Hermann, and Houston Methodist",
  NYC: "NewYork-Presbyterian, Mount Sinai, Montefiore, and NYU Langone",
  Baltimore: "Johns Hopkins Hospital and University of Maryland Medical Center",
 "Los Angeles": "UCLA Medical Center and Cedars-Sinai",
 "San Francisco": "UCSF Medical Center and Stanford Health Care",
 "Ann Arbor": "University of Michigan Health",
  Durham: "Duke University Hospital",
  Philadelphia: "Penn Medicine and Thomas Jefferson University Hospital",
  Chicago: "Northwestern Memorial, Rush University Medical Center, and UChicago Medicine",
  Atlanta: "Emory University Hospital and Grady Memorial",
  Seattle: "UW Medical Center and Harborview Medical Center",
  Dallas: "UT Southwestern Medical Center and Parkland Hospital",
 "Rochester MN": "Mayo Clinic",
  Indianapolis: "IU Health and Eskenazi Health",
  Birmingham: "UAB Hospital",
  Cincinnati: "UC Medical Center and Cincinnati Children's",
  Minneapolis: "University of Minnesota Medical Center",
  Charleston: "Medical University of South Carolina (MUSC)",
 "New Orleans": "Ochsner Medical Center and Tulane Medical Center",
  Madison: "UW Health and University of Wisconsin Hospital",
  Denver: "University of Colorado Hospital and Denver Health",
  Gainesville: "UF Health Shands Hospital",
 "Chapel Hill": "UNC Medical Center",
  Charlottesville: "UVA Health",
 "Iowa City": "University of Iowa Hospitals and Clinics",
  Lexington: "UK HealthCare and UK Chandler Hospital",
  Tampa: "Tampa General Hospital and Moffitt Cancer Center",
 "Kansas City": "University of Kansas Medical Center",
  Omaha: "Nebraska Medicine and UNMC",
  Memphis: "Methodist Le Bonheur and Regional One Health",
 "Rochester NY": "Strong Memorial Hospital and Rochester General",
 "Washington DC": "MedStar, GW Hospital, and Georgetown University Hospital",
  Detroit: "Henry Ford Hospital and Detroit Medical Center",
 "Winston-Salem": "Wake Forest Baptist Medical Center",
 "Danville PA": "Geisinger Medical Center",
 "Travel Nurse": "hospitals nationwide",
  Medical: "teaching hospitals and medical centers nationwide",
 "East Tennessee": "ETSU/Quillen College of Medicine",
  Connecticut: "UConn Health Center",
  Oakland: "Highland Hospital, Kaiser Oakland, and UCSF-affiliated sites",
  Florida: "hospitals across Florida",
 "New Haven": "Yale-New Haven Hospital",
  Albany: "Albany Medical Center",
 "Burlington VT": "UVM Medical Center",
  Richmond: "VCU Medical Center and McGuire VA",
 "Columbus OH": "Ohio State Wexner Medical Center and Nationwide Children's",
 "St. Louis": "Barnes-Jewish Hospital, St. Louis University Hospital, and Washington University",
  Milwaukee: "Froedtert Hospital and Medical College of Wisconsin",
 "East Lansing": "Sparrow Hospital and MSU affiliated sites",
  Orlando: "Orlando Health, AdventHealth, and Nemours Children's",
  Louisville: "UofL Hospital, Norton Healthcare, and Baptist Health",
  Sacramento: "UC Davis Medical Center and Sutter Medical Center",
 "San Antonio": "UT Health San Antonio, University Hospital, and Brooke Army Medical Center",
  Austin: "Dell Seton Medical Center and Ascension Seton",
 "San Diego": "UC San Diego Health and Scripps Health",
  Irvine: "UC Irvine Medical Center and CHOC",
  Portland: "OHSU Hospital and Providence Portland",
  Tucson: "Banner University Medical Center Tucson",
 "Salt Lake City": "University of Utah Hospital and Intermountain Health",
  Albuquerque: "UNM Hospital",
 "Oklahoma City": "OU Medical Center and Oklahoma Children's",
  Galveston: "UTMB Health",
  Aurora: "University of Colorado Hospital (Anschutz Medical Campus)",
  Toledo: "University of Toledo Medical Center and ProMedica",
 "Loma Linda": "Loma Linda University Medical Center",
  Tallahassee: "Tallahassee Memorial and FSU-affiliated sites",
  Augusta: "Augusta University Medical Center (MCG)",
 "Columbia SC": "Prisma Health Richland and USC School of Medicine",
};

const GROUP_LINK_FOOTER = `\nAlso join our Medical Resident Housing group for more resources and to connect with other relocating residents: ${SWEETLEASE_GROUP_SHORT}`;

function getUtmLink(city: string): string {
  const slug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `sweetlease.io?utm_source=facebook&utm_medium=social&utm_campaign=group-outreach&utm_content=${slug}`;
}

function getCityPost(city: string): string {
  const link = getUtmLink(city);

  if (city === "Travel Nurse") {
    return `Hey everyone! If you are relocating for an assignment and need furnished housing near the hospital, check out SweetLease.

We are a free service that negotiates rent on your behalf with property managers near major medical centers. We cover 12+ cities including Houston, Nashville, Pittsburgh, Cleveland, Boston, Miami, and more.

How it works:
- Tell us your budget, bedrooms, and assignment dates
- We match you to furnished properties within 15 min of the hospital
- We negotiate rent using group demand - typically 10-35% below listed rent
- Virtual tours so you can decide before arriving
- Sign your lease remotely
- 100% free for healthcare workers

${link}

Happy to answer any questions!${GROUP_LINK_FOOTER}`;
  }

  if (city === "Medical") {
    return `Hey everyone! If you are starting rotations or residency and need to find housing in a new city, check out SweetLease.

We are a free service built specifically for medical trainees relocating for residency or clinical rotations. We negotiate rent on your behalf with property managers near teaching hospitals.

We cover 12+ cities including Houston, Nashville, Pittsburgh, Cleveland, Boston, Miami, and more.

How it works:
- Tell us your budget, bedrooms, and move-in date
- We match you to properties within 15 min of the hospital
- We negotiate rent using group demand - typically 10-35% below listed rent
- Virtual tours, remote lease signing, the whole process handled for you
- 100% free for medical trainees

${link}

Happy to answer questions!${GROUP_LINK_FOOTER}`;
  }

  if (city === "National") {
    return `Hey everyone! Congrats on matching!

If you are relocating for residency and stressed about finding housing from out of state, check out SweetLease. We are a free service that negotiates rent on your behalf with property managers near your hospital.

We cover 12+ cities including Houston, Nashville, Columbus, Pittsburgh, Cleveland, Cincinnati, Boston, Miami, and more.

Residents typically save 10-35% below listed rent. We handle everything remotely - virtual tours, lease signing, the whole process.

${link} - completely free for residents.

Happy to answer questions!${GROUP_LINK_FOOTER}`;
  }

  const hospitals = CITY_HOSPITALS[city] || "major hospitals";

  return `Hey everyone! Congrats on matching to ${city}!

Finding housing from out of state is stressful, especially when you are on a tight timeline. I built a free service specifically for this.

SweetLease negotiates rent on your behalf with property managers near ${hospitals}. We typically save residents 10-35% below listed rent.

How it works:
- Tell us your budget, bedrooms, and move-in date
- We match you to properties within 15 min of the hospital
- We negotiate rent using group demand
- Virtual tours so you can decide before arriving
- Sign your lease remotely
- 100% free

We are already working with property managers in ${city} and have placed residents sight unseen.

Check us out at ${link}

Happy to answer any questions!${GROUP_LINK_FOOTER}`;
}

function getEmailPostForGroup(group: GroupData): string {
  const postText = getCityPost(group.city);
  return `--- ${group.name} (${group.city}) ---\nGroup: ${group.url}\n\n${postText}\n\n`;
}

function generateAllPostsText(): string {
  const cities = Array.from(new Set(GROUPS.map((g) => g.city)));
  let output = "SweetLease Social Outreach Posts\n";
  output += `Generated: ${new Date().toLocaleDateString()}\n`;
  output += `Total Groups: ${GROUPS.length}\n`;
  output += "=".repeat(60) + "\n\n";

  for (const city of cities) {
    const cityGroups = GROUPS.filter((g) => g.city === city);
    output += `\n${"=".repeat(40)}\n`;
    output += `  ${city.toUpperCase()} (${cityGroups.length} groups)\n`;
    output += `${"=".repeat(40)}\n\n`;

    for (const group of cityGroups) {
      output += getEmailPostForGroup(group);
    }
  }

  return output;
}

function downloadAllPosts() {
  const text = generateAllPostsText();
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sweetlease-social-posts-${new Date().toISOString().split("T")[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function emailAllPosts() {
  const subject = encodeURIComponent("SweetLease Social Outreach Posts");
  const bodyText = generateAllPostsText();
  // mailto has length limits, so we trim if needed
  const maxLen = 1800;
  let body: string;
  if (bodyText.length > maxLen) {
    body = encodeURIComponent(
      bodyText.substring(0, maxLen) +
 "\n\n... (Download full file for all posts - too long for email link)"
    );
  } else {
    body = encodeURIComponent(bodyText);
  }
  window.open(`mailto:terrellgilb5@gmail.com?subject=${subject}&body=${body}`, "_self");
}

function getStatus(lastPosted: string | undefined): { label: string; color: string; priority: number } {
  if (!lastPosted) {
    return { label: "Never posted", color: "red", priority: 0 };
  }
  const daysSince = Math.floor((Date.now() - new Date(lastPosted).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince >= REPOST_DAYS) {
    return { label: `Due for repost (${daysSince}d ago)`, color: "amber", priority: 1 };
  }
  return { label: `Recent (${daysSince}d ago)`, color: "green", priority: 2 };
}

// --- Components ---

function SweetLeaseGroupHero() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(SWEETLEASE_GROUP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = SWEETLEASE_GROUP_URL;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-orange-400  overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="bg-orange-100 rounded-lg p-3">
            <Star size={28} className="text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900">Medical Resident Housing - SweetLease</h2>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">YOUR GROUP</span>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Cross-promote this group in every post. Link it everywhere - this is our owned community for incoming residents.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={SWEETLEASE_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <ExternalLink size={14} />
                Open Group
              </a>
              <button
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {copied ? <Check size={14} /> : <Link size={14} />}
                {copied ? "Copied!" : "Copy Group Link"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  lastPosted,
  onMarkPosted,
}: {
  group: GroupData;
  lastPosted: string | undefined;
  onMarkPosted: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const status = getStatus(lastPosted);
  const postText = getCityPost(group.city);
  const cityColor = CITY_COLORS[group.city] || { bg: "bg-gray-100", text: "text-gray-700" };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = postText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailPost = () => {
    const subject = encodeURIComponent("Free housing resource for your incoming residents");
    const body = encodeURIComponent(postText);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  const statusColors: Record<string, string> = {
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    red: <AlertCircle size={14} />,
    amber: <Clock size={14} />,
    green: <CheckCircle2 size={14} />,
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200  overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left side */}
        <div className="lg:w-72 p-5 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{group.name}</h3>
            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cityColor.bg} ${cityColor.text}`}>
              {group.city}
            </span>
          </div>

          <a
            href={group.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ExternalLink size={14} />
            Open Group
          </a>

          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusColors[status.color]}`}>
            {statusIcons[status.color]}
            {status.label}
          </div>

          {lastPosted && (
            <p className="text-xs text-slate-400">
              Last posted: {new Date(lastPosted).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="flex-1 p-5 flex flex-col gap-3">
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-4 border border-slate-100 max-h-64 overflow-y-auto leading-relaxed">
            {postText}
          </pre>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Post"}
            </button>

            <button
              onClick={() => onMarkPosted(group.url)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <CheckCircle2 size={14} />
              Mark as Posted
            </button>

            <button
              onClick={handleEmailPost}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Mail size={14} />
              Email Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Page ---

export default function SocialOutreachPage() {
  const [tracker, setTracker] = useState<PostTracker>({});
  const [filter, setFilter] = useState<FilterTab>("all");

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTracker(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveTracker = useCallback((updated: PostTracker) => {
    setTracker(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const handleMarkPosted = useCallback(
    (url: string) => {
      const updated = { ...tracker, [url]: new Date().toISOString() };
      saveTracker(updated);
    },
    [tracker, saveTracker]
  );

  // Filter and sort groups
  const filteredGroups = GROUPS.filter((g) => {
    const status = getStatus(tracker[g.url]);
    if (filter === "never") return status.color === "red";
    if (filter === "due") return status.color === "amber";
    return true;
  }).sort((a, b) => {
    const aPriority = getStatus(tracker[a.url]).priority;
    const bPriority = getStatus(tracker[b.url]).priority;
    return aPriority - bPriority;
  });

  // Stats
  const totalGroups = GROUPS.length;
  const neverPosted = GROUPS.filter((g) => !tracker[g.url]).length;
  const dueForRepost = GROUPS.filter((g) => {
    const s = getStatus(tracker[g.url]);
    return s.color === "amber";
  }).length;
  const postedThisWeek = GROUPS.filter((g) => {
    const last = tracker[g.url];
    if (!last) return false;
    const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }).length;
  const uniqueCities = Array.from(new Set(GROUPS.map((g) => g.city))).length;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalGroups },
    { key: "due", label: "Due for Repost", count: dueForRepost },
    { key: "never", label: "Never Posted", count: neverPosted },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Share2 size={22} className="text-amber-600" />
            <h1 className="text-lg font-semibold text-slate-900">Social Outreach</h1>
          </div>
          <p className="text-sm text-slate-500">
            Copy and paste into Facebook groups - {totalGroups} groups across {uniqueCities} cities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={emailAllPosts}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Mail size={14} />
            Email All Posts to Me
          </button>
          <button
            onClick={downloadAllPosts}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download size={14} />
            Download All Posts
          </button>
        </div>
      </div>

      {/* SweetLease Group Hero */}
      <SweetLeaseGroupHero />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Groups</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalGroups}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Posted This Week</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{postedThisWeek}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Due for Repost</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{dueForRepost}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Never Posted</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{neverPosted}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-white text-slate-900 "
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Group Cards */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Filter size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No groups match this filter</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <GroupCard
              key={group.url}
              group={group}
              lastPosted={tracker[group.url]}
              onMarkPosted={handleMarkPosted}
            />
          ))
        )}
      </div>
    </div>
  );
}
