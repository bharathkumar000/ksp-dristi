import csv
import json
import os
import random

# Coordinates dictionary for Karnataka districts to geolocate cases
DISTRICT_COORDS = {
    'bagalkot': (16.1817, 75.6958),
    'bengaluru city': (12.9716, 77.5946),
    'bengaluru dist': (12.9716, 77.5946),
    'mysuru city': (12.2958, 76.6394),
    'mysuru dist': (12.2958, 76.6394),
    'dakshina kannada': (12.8702, 74.8431),
    'mangaluru city': (12.8702, 74.8431),
    'belagavi city': (15.8497, 74.4977),
    'belagavi dist': (15.8497, 74.4977),
    'dharwad': (15.4589, 75.0078),
    'hubballi dharwad city': (15.4589, 75.0078),
    'kalaburagi city': (17.3297, 76.8343),
    'kalaburagi dist': (17.3297, 76.8343),
    'davangere': (14.4644, 75.9218),
    'tumakuru': (13.3392, 77.1140),
    'shivamogga': (13.9299, 75.5681),
    'udupi': (13.3409, 74.7421),
    'kolar': (13.1368, 78.1292),
    'mandya': (12.5218, 76.8951),
    'ballari': (15.1394, 76.9214),
    'chikkamagaluru': (13.3161, 75.7720),
    'hassan': (13.0068, 76.1026),
    'kodagu': (12.4244, 75.7382),
    'koppal': (15.3468, 76.1553),
    'raichur': (16.2120, 77.3556),
    'ramanagara': (12.7150, 77.2813),
    'uttara kannada': (14.8080, 74.5828),
    'vijayapura': (16.8302, 75.7100),
    'chamarajanagar': (11.9264, 76.9437),
    'chikkaballapura': (13.4354, 77.7275),
    'chitradurga': (14.2274, 76.4014),
    'haveri': (14.7954, 75.3984),
    'yadgir': (16.7622, 77.1442)
}

# Names lists for generating synthetic details aligned with Karnataka context
COMPLAINANT_NAMES = ['Rajesh Gowda', 'Anil Patil', 'Manjunath Swamy', 'Srinivas Murthy', 'Vijay Kumar', 
                     'Sunita Devi', 'Savitha Rao', 'Fathima Begum', 'Ramesh Nayak', 'Suresh Hegde',
                     'Radha Bhat', 'Saraswathi Shenoy', 'Imran Khan', 'Prakash Jadhav', 'Ganesh Biradar']

OCCUPATIONS = ['Business', 'IT Professional', 'Agriculture', 'Teacher', 'Government Service', 
               'Daily Wage Worker', 'Retired', 'Unemployed Graduate', 'Merchant', 'Driver']

RELIGIONS = ['Hindu', 'Hindu', 'Hindu', 'Muslim', 'Christian', 'Hindu', 'Jain']
CASTES = ['General', 'Vokkaliga', 'Lingayat', 'Kuruba', 'Brahmin', 'SC/ST', 'OBC']

ACCUSED_NAMES = ['Kiran Kumar (Mule)', 'Amit Sharma (Tech Op)', 'Lokesha alias \'Punda\'', 'John D\'Souza',
                 'Shanthappa', 'Naveena alias \'Kulla\'', 'Shekhara', 'Santhosh Kumar', 'Raghu alias \'Setup\'']

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    csv_path = os.path.join(project_root, 'resources', 'FIR_Details_Data.csv')
    json_out_path = os.path.join(project_root, 'public', 'sample_fir_data.json')

    print("Starting CSV parsing...")
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return

    # Read records from CSV
    all_rows = []
    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            all_rows.append(row)

    print(f"Total rows read: {len(all_rows)}")

    # Diverse sampling: focus on records with complete data, then sample 1,200 rows randomly
    valid_rows = [r for r in all_rows if r.get('District_Name') and r.get('UnitName') and r.get('CrimeGroup_Name')]
    if len(valid_rows) > 1200:
        # Mix the first 400, last 400, and 400 random middle rows to capture different years/districts
        sampled_rows = valid_rows[:400] + valid_rows[-400:] + random.sample(valid_rows[400:-400], 400)
    else:
        sampled_rows = valid_rows

    print(f"Sampled {len(sampled_rows)} rows for the database.")

    # Relational tables to generate
    units = []
    case_masters = []
    complainants = []
    victims = []
    accused_list = []
    arrest_surrenders = []
    act_sections = []
    financial_txns = []

    unit_set = set()
    accused_id_counter = 1
    comp_id_counter = 1
    victim_id_counter = 1
    arrest_id_counter = 1
    txn_id_counter = 1

    for idx, row in enumerate(sampled_rows):
        case_id = f"C_{idx+1:04d}"
        unit_id = row.get('Unit_ID') or f"U_{row.get('UnitName', 'Unknown').replace(' ', '_')}"
        unit_name = row.get('UnitName', 'Unknown PS')
        district = row.get('District_Name', 'Unknown')

        # Add unique station Units
        if unit_id not in unit_set:
            unit_set.add(unit_id)
            units.append({
                "UnitID": unit_id,
                "UnitName": unit_name,
                "DistrictID": f"D_{district.upper().replace(' ', '_')}"
            })

        # Calculate Latitude / Longitude
        lat_val = row.get('Latitude')
        lng_val = row.get('Longitude')
        
        try:
            latitude = float(lat_val) if lat_val else 0.0
            longitude = float(lng_val) if lng_val else 0.0
        except ValueError:
            latitude = 0.0
            longitude = 0.0

        # If coordinates are missing or invalid, generate based on district offset
        if latitude == 0.0 or longitude == 0.0:
            dist_lower = district.lower().strip()
            base_coords = DISTRICT_COORDS.get(dist_lower, (12.9716, 77.5946))
            # Add small random scatter (approx 3-10km offset) to avoid stacking markers
            latitude = base_coords[0] + (random.random() - 0.5) * 0.09
            longitude = base_coords[1] + (random.random() - 0.5) * 0.09

        # Case dates
        year = row.get('FIR_YEAR') or '2026'
        month = row.get('FIR_MONTH') or '01'
        day = row.get('FIR_Day') or '01'
        if len(month) == 1: month = f"0{month}"
        if len(day) == 1: day = f"0{day}"
        incident_date = f"{year}-{month}-{day}T00:00:00Z"

        crime_no = f"{unit_name.split(' ')[0]}/FIR/{year}/{idx+1}"
        case_no = f"CC/{idx+1}/{year}"

        brief_facts = f"Occurrence at {row.get('Place of Offence', 'station limits')}. Crime category: {row.get('CrimeGroup_Name')}. Investigating Officer assigned: {row.get('IOName', 'Station IO')}."

        # Add CaseMaster
        case_masters.append({
            "CaseMasterID": case_id,
            "CrimeNo": crime_no,
            "CaseNo": case_no,
            "PoliceStationID": unit_id,
            "CrimeMajorHeadID": row.get('CrimeGroup_Name', 'Others'),
            "CrimeMinorHeadID": row.get('CrimeHead_Name', 'Others'),
            "IncidentFromDate": incident_date,
            "latitude": latitude,
            "longitude": longitude,
            "BriefFacts": brief_facts
        })

        # Add ComplainantDetails & Victim (generate realistic details)
        age = int(row.get('Age 0') or random.randint(22, 60))
        if age == 0: age = random.randint(22, 60)
        
        male_count = int(row.get('Male') or 0)
        female_count = int(row.get('Female') or 0)
        boy_count = int(row.get('Boy') or 0)
        girl_count = int(row.get('Girl') or 0)
        
        gender = 'Male'
        if female_count > 0 or girl_count > 0:
            gender = 'Female'
        elif male_count == 0 and boy_count == 0:
            gender = random.choice(['Male', 'Female'])

        comp_name = random.choice(COMPLAINANT_NAMES)
        comp_id = f"CP_{comp_id_counter:04d}"
        comp_id_counter += 1
        
        complainants.append({
            "ComplainantID": comp_id,
            "ComplainantName": comp_name,
            "AgeYear": age,
            "OccupationID": random.choice(OCCUPATIONS),
            "ReligionID": random.choice(RELIGIONS),
            "CasteID": random.choice(CASTES),
            "GenderID": gender,
            "CaseMasterID": case_id
        })

        # Set Victim count records
        victim_count = int(row.get('VICTIM COUNT') or 1)
        for v_i in range(max(1, victim_count)):
            v_id = f"V_{victim_id_counter:04d}"
            victim_id_counter += 1
            victims.append({
                "VictimMasterID": v_id,
                "VictimName": comp_name if v_i == 0 else f"Victim {v_i+1} (Case {case_id})",
                "AgeYear": age if v_i == 0 else random.randint(18, 65),
                "GenderID": gender if v_i == 0 else random.choice(['Male', 'Female']),
                "CaseMasterID": case_id
            })

        # Add Accused (link repeating names to form network nodes)
        accused_count = int(row.get('Accused Count') or 0)
        if accused_count == 0:
            accused_count = random.choice([0, 1, 2])

        for a_i in range(accused_count):
            acc_name = random.choice(ACCUSED_NAMES) if random.random() > 0.4 else f"Suspect_{idx+1}_{a_i+1}"
            acc_id = f"A_{accused_id_counter:04d}"
            accused_id_counter += 1
            
            accused_list.append({
                "AccusedMasterID": acc_id,
                "AccusedName": acc_name,
                "AgeYear": random.randint(19, 50),
                "GenderID": "Male" if random.random() > 0.1 else "Female",
                "PersonID": f"P_{hash(acc_name) % 10000:04d}",
                "CaseMasterID": case_id
            })

            # Add ArrestSurrender details if arrested
            arrested_male = int(row.get('Arrested Male') or 0)
            arrested_female = int(row.get('Arrested Female') or 0)
            if arrested_male > 0 or arrested_female > 0:
                arr_id = f"AS_{arrest_id_counter:04d}"
                arrest_id_counter += 1
                arrest_surrenders.append({
                    "ArrestSurrenderID": arr_id,
                    "ArrestSurrenderDate": incident_date,
                    "IOID": row.get('IOName', 'Station IO'),
                    "CourtID": "ACMM_Court",
                    "AccusedMasterID": acc_id,
                    "CaseMasterID": case_id
                })

                # If cyber/theft/gambling, generate bank transactions for money trails
                group_name = row.get('CrimeGroup_Name', '').lower()
                if 'police act' in group_name or 'theft' in group_name or 'pocso' in group_name:
                    txn_id = f"TXN_{txn_id_counter:04d}"
                    txn_id_counter += 1
                    amount = random.randint(5000, 250000)
                    financial_txns.append({
                        "TransactionID": txn_id,
                        "SourceAccount": f"{comp_name} (Acct)",
                        "TargetAccount": f"Mule_{hash(acc_name) % 1000:03d} (Bank)",
                        "Amount": amount,
                        "Timestamp": incident_date,
                        "AccusedMasterID": acc_id,
                        "CaseMasterID": case_id,
                        "SuspectName": acc_name
                    })

        # Add ActSectionAssociation
        act_sec_raw = row.get('ActSection') or 'IPC U/s: 379'
        # Basic parser to separate Acts
        act_sections.append({
            "ActID": act_sec_raw.split(' ')[0],
            "SectionID": act_sec_raw.replace('IPC 1860', '').replace('U/s:', '').strip()[:80],
            "CaseMasterID": case_id
        })

    # Assemble complete JSON payload
    db_payload = {
        "Unit": units,
        "CaseMaster": case_masters,
        "ComplainantDetails": complainants,
        "Victim": victims,
        "Accused": accused_list,
        "ArrestSurrender": arrest_surrenders,
        "ActSectionAssociation": act_sections,
        "FinancialTransactions": financial_txns
    }

    # Write to target path
    with open(json_out_path, 'w', encoding='utf-8') as f:
        json.dump(db_payload, f, indent=2)

    print(f"Relational JSON database created at: {json_out_path}")

    # Write to CSV files for Zoho Catalyst import
    csv_dir = os.path.join(os.path.dirname(json_out_path), 'catalyst_csv')
    os.makedirs(csv_dir, exist_ok=True)
    
    for table_name, records in db_payload.items():
        if not records:
            continue
        csv_file_path = os.path.join(csv_dir, f"{table_name}.csv")
        headers = list(records[0].keys())
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as f_csv:
            writer = csv.DictWriter(f_csv, fieldnames=headers)
            writer.writeheader()
            writer.writerows(records)
            
    print(f"Relational CSV files created in: {csv_dir}")
    print(f"Total Cases: {len(case_masters)}")
    print(f"Total Accused: {len(accused_list)}")
    print(f"Total Transactions Traced: {len(financial_txns)}")

if __name__ == '__main__':
    main()
