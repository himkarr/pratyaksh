import urllib.request
import json
import uuid

SUPABASE_REST_URL = "https://kslsyhrrfnshbdujzhdr.supabase.co/rest/v1/projects"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHN5aHJyZm5zaGJkdWp6aGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQyMjc3MCwiZXhwIjoyMTAzOTk4NzcwfQ.Dg9q_NvF65haWgygslmN3cQbGvy0VWriF_3J6hpwTVI"

def gen_uuid(work_id):
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, work_id))

raw_projects = [
  # ROHTAK PROJECTS (12)
  {
    "id": "WORK-HR-RTK-001",
    "title": "Construction of Community Health Centre (CHC) Building & Oxygen Plant, Kalanaur",
    "category": "Health",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 15000000.0,
    "utilized_amount": 9500000.0,
    "progress_percentage": 70,
    "status": "InProgress",
    "start_date": "2024-03-15",
    "expected_completion_date": "2025-04-30",
    "contractor": "M/s Haryana Civil Infra Services"
  },
  {
    "id": "WORK-HR-RTK-002",
    "title": "Construction of Concrete Rural Access Road & Drainage Network, Sampla Block",
    "category": "Roads",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 9000000.0,
    "utilized_amount": 8800000.0,
    "progress_percentage": 100,
    "status": "Completed",
    "start_date": "2024-01-10",
    "expected_completion_date": "2024-11-30",
    "contractor": "M/s Rohtak Development & Builders Ltd."
  },
  {
    "id": "WORK-HR-RTK-003",
    "title": "Upgradation of Higher Secondary School Science & Computer Labs, Rohtak City",
    "category": "Education",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 6500000.0,
    "utilized_amount": 2000000.0,
    "progress_percentage": 25,
    "status": "InProgress",
    "start_date": "2024-06-01",
    "expected_completion_date": "2025-05-31",
    "contractor": "M/s Apex North Infrastructure Pvt Ltd."
  },
  {
    "id": "WORK-HR-RTK-004",
    "title": "Solar Street Light Installation & Public Parks Development, Meham",
    "category": "Community Assets",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 4500000.0,
    "utilized_amount": 1000000.0,
    "progress_percentage": 10,
    "status": "Delayed",
    "start_date": "2024-07-15",
    "expected_completion_date": "2025-06-30",
    "contractor": "M/s Haryana Civil Infra Services"
  },
  {
    "id": "WORK-HR-RTK-005",
    "title": "Construction of Solar Powered Overhead Water Tank & Pipeline Network, Lakhan Majra",
    "category": "Drinking Water",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 11000000.0,
    "utilized_amount": 7500000.0,
    "progress_percentage": 65,
    "status": "InProgress",
    "start_date": "2024-02-18",
    "expected_completion_date": "2025-03-31",
    "contractor": "M/s Rohtak Development & Builders Ltd."
  },
  {
    "id": "WORK-HR-RTK-006",
    "title": "Multi-Purpose Sports Complex & Gymnasium Building, MDU Campus Area, Rohtak",
    "category": "Community Assets",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 18000000.0,
    "utilized_amount": 18000000.0,
    "progress_percentage": 100,
    "status": "Completed",
    "start_date": "2023-11-05",
    "expected_completion_date": "2024-10-30",
    "contractor": "M/s Apex North Infrastructure Pvt Ltd."
  },
  {
    "id": "WORK-HR-RTK-007",
    "title": "Construction of Sub-Health Centre & Diagnostic Lab, Kahanaur Sector",
    "category": "Health",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 8500000.0,
    "utilized_amount": 1500000.0,
    "progress_percentage": 15,
    "status": "Sanctioned",
    "start_date": "2024-05-10",
    "expected_completion_date": "2025-05-09",
    "contractor": "M/s Haryana Civil Infra Services"
  },
  {
    "id": "WORK-HR-RTK-008",
    "title": "Construction of Four-Lane Bypass Feeder Road & Stormwater Drain, IMT Sector",
    "category": "Roads",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 22000000.0,
    "utilized_amount": 11000000.0,
    "progress_percentage": 50,
    "status": "InProgress",
    "start_date": "2024-02-01",
    "expected_completion_date": "2025-06-30",
    "contractor": "M/s Rohtak Development & Builders Ltd."
  },
  {
    "id": "WORK-HR-RTK-009",
    "title": "Establishment of Model Smart Anganwadi Centres & E-Learning Pods, Beri Highway Belt",
    "category": "Education",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 5000000.0,
    "utilized_amount": 4800000.0,
    "progress_percentage": 100,
    "status": "Completed",
    "start_date": "2024-01-20",
    "expected_completion_date": "2024-09-30",
    "contractor": "M/s Apex North Infrastructure Pvt Ltd."
  },
  {
    "id": "WORK-HR-RTK-010",
    "title": "Installation of RO Water Purification Kiosks & Deep Tube-wells, Asthal Bohar Area",
    "category": "Drinking Water",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 7500000.0,
    "utilized_amount": 3000000.0,
    "progress_percentage": 40,
    "status": "InProgress",
    "start_date": "2024-04-05",
    "expected_completion_date": "2025-04-04",
    "contractor": "M/s Haryana Civil Infra Services"
  },
  {
    "id": "WORK-HR-RTK-011",
    "title": "Construction of Senior Citizen Activity Centre & Community Hall, Sector 14, Rohtak",
    "category": "Community Assets",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 12500000.0,
    "utilized_amount": 2500000.0,
    "progress_percentage": 20,
    "status": "Sanctioned",
    "start_date": "2024-06-15",
    "expected_completion_date": "2025-06-14",
    "contractor": "M/s Rohtak Development & Builders Ltd."
  },
  {
    "id": "WORK-HR-RTK-012",
    "title": "Widening & Bituminous Overlay of Rural Link Road connecting Kiloi to Rohtak Highway",
    "category": "Roads",
    "district": "Rohtak",
    "state": "Haryana",
    "sanctioned_amount": 14000000.0,
    "utilized_amount": 9000000.0,
    "progress_percentage": 60,
    "status": "InProgress",
    "start_date": "2024-03-01",
    "expected_completion_date": "2025-03-31",
    "contractor": "M/s Apex North Infrastructure Pvt Ltd."
  },

  # GURUGRAM PROJECTS (4)
  {
    "id": "WORK-HR-GGM-001",
    "title": "Construction of Smart Skill Development & Employment Hub, Sohna Block",
    "category": "Community Assets",
    "district": "Gurugram",
    "state": "Haryana",
    "sanctioned_amount": 21000000.0,
    "utilized_amount": 12500000.0,
    "progress_percentage": 60,
    "status": "InProgress",
    "start_date": "2024-02-20",
    "expected_completion_date": "2025-03-31",
    "contractor": "M/s Millennium City Builders & Engineers"
  },
  {
    "id": "WORK-HR-GGM-002",
    "title": "Stormwater Drainage Line & Interceptor System, Pataudi Sub-Division",
    "category": "Drinking Water",
    "district": "Gurugram",
    "state": "Haryana",
    "sanctioned_amount": 13000000.0,
    "utilized_amount": 13000000.0,
    "progress_percentage": 100,
    "status": "Completed",
    "start_date": "2024-01-05",
    "expected_completion_date": "2024-10-15",
    "contractor": "M/s Millennium City Builders & Engineers"
  },
  {
    "id": "WORK-HR-GGM-003",
    "title": "Solar Powered Water Filtration Plants & RO Kiosks, Farrukhnagar",
    "category": "Drinking Water",
    "district": "Gurugram",
    "state": "Haryana",
    "sanctioned_amount": 8000000.0,
    "utilized_amount": 3500000.0,
    "progress_percentage": 40,
    "status": "InProgress",
    "start_date": "2024-04-12",
    "expected_completion_date": "2025-04-11",
    "contractor": "M/s Millennium City Builders & Engineers"
  },
  {
    "id": "WORK-HR-GGM-004",
    "title": "Infrastructure Expansion of Multi-Specialty Civic Health Clinic, Badshahpur",
    "category": "Health",
    "district": "Gurugram",
    "state": "Haryana",
    "sanctioned_amount": 17500000.0,
    "utilized_amount": 4000000.0,
    "progress_percentage": 20,
    "status": "Sanctioned",
    "start_date": "2024-05-18",
    "expected_completion_date": "2025-06-30",
    "contractor": "M/s Millennium City Builders & Engineers"
  },

  # JABALPUR PROJECTS (6)
  {
    "id": "WORK-MP-JBL-001",
    "title": "Construction of Concrete Access Road & Culvert Bridge in Sihora Rural Sector",
    "category": "Roads",
    "district": "Jabalpur",
    "state": "Madhya Pradesh",
    "sanctioned_amount": 8500000.0,
    "utilized_amount": 5500000.0,
    "progress_percentage": 65,
    "status": "InProgress",
    "start_date": "2024-04-01",
    "expected_completion_date": "2025-03-31",
    "contractor": "M/s Apex Infra & Construction Ltd."
  },
  {
    "id": "WORK-MP-JBL-002",
    "title": "Installation of Overhead Drinking Water Storage Tank & Pipeline Network in Patan Block",
    "category": "Drinking Water",
    "district": "Jabalpur",
    "state": "Madhya Pradesh",
    "sanctioned_amount": 12000000.0,
    "utilized_amount": 4000000.0,
    "progress_percentage": 35,
    "status": "InProgress",
    "start_date": "2024-05-10",
    "expected_completion_date": "2025-05-09",
    "contractor": "M/s Sagar Waterworks & Civil Corp"
  },
  {
    "id": "WORK-MP-JBL-003",
    "title": "Construction of Sub-Health Center Building & Emergency Care Unit, Panagar Sector",
    "category": "Health",
    "district": "Jabalpur",
    "state": "Madhya Pradesh",
    "sanctioned_amount": 9500000.0,
    "utilized_amount": 1500000.0,
    "progress_percentage": 15,
    "status": "Sanctioned",
    "start_date": "2024-06-01",
    "expected_completion_date": "2025-05-31",
    "contractor": "M/s Apex Infra & Construction Ltd."
  },
  {
    "id": "WORK-MP-JBL-004",
    "title": "Upgradation & Digital Smart Classroom Complex in Model School, Jabalpur West",
    "category": "Education",
    "district": "Jabalpur",
    "state": "Madhya Pradesh",
    "sanctioned_amount": 6000000.0,
    "utilized_amount": 5400000.0,
    "progress_percentage": 90,
    "status": "InProgress",
    "start_date": "2024-02-15",
    "expected_completion_date": "2024-12-31",
    "contractor": "M/s Infra Buildcon India Ltd."
  },
  {
    "id": "WORK-MP-JBL-005",
    "title": "Solar Rooftop Power Plant & High-Mast LED Lighting in Cantonment Public Parks",
    "category": "Community Assets",
    "district": "Jabalpur",
    "state": "Madhya Pradesh",
    "sanctioned_amount": 4000000.0,
    "utilized_amount": 4000000.0,
    "progress_percentage": 100,
    "status": "Completed",
    "start_date": "2024-01-10",
    "expected_completion_date": "2024-09-30",
    "contractor": "M/s Sagar Waterworks & Civil Corp"
  },
  {
    "id": "WORK-MP-JBL-006",
    "title": "Multi-Purpose Skill Development Center & Community Hall, Kundam Block",
    "category": "Community Assets",
    "district": "Jabalpur",
    "state": "Madhya Pradesh",
    "sanctioned_amount": 7500000.0,
    "utilized_amount": 3500000.0,
    "progress_percentage": 45,
    "status": "InProgress",
    "start_date": "2024-03-20",
    "expected_completion_date": "2025-03-19",
    "contractor": "M/s Apex Infra & Construction Ltd."
  }
]

db_rows = []
for p in raw_projects:
    db_rows.append({
        "project_id": gen_uuid(p["id"]),
        "recommendation_id": gen_uuid(f"rec-{p['id']}"),
        "project_name": p["title"],
        "description": f"Official {p['district']} District Infrastructure Work assigned to {p['contractor']}",
        "category": p["category"],
        "district": p["district"],
        "state": p["state"],
        "sanctioned_amount": p["sanctioned_amount"],
        "utilized_amount": p["utilized_amount"],
        "progress_percentage": p["progress_percentage"],
        "status": p["status"],
        "start_date": p["start_date"],
        "expected_completion_date": p["expected_completion_date"],
        "tender_reference_no": p["contractor"]
    })

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

req = urllib.request.Request(SUPABASE_REST_URL, data=json.dumps(db_rows).encode('utf-8'), headers=headers, method="POST")
try:
    with urllib.request.urlopen(req) as resp:
        print(f"Successfully upserted {len(db_rows)} district projects into Supabase DB! Response code:", resp.getcode())
except Exception as e:
    if hasattr(e, 'read'):
        print("Error upserting projects:", e.read().decode('utf-8'))
    else:
        print("Error upserting projects:", e)
