import os
import requests

# Monkeypatch requests.Session.request to clean up double slashes in URL paths
original_request = requests.Session.request
def patched_request(self, method, url, *args, **kwargs):
    if isinstance(url, str):
        original = url
        parts = url.split("://", 1)
        if len(parts) == 2:
            proto, path = parts
            path = path.replace("//", "/")
            url = f"{proto}://{path}"
        print(f"[{method}] {url}", flush=True)
    return original_request(self, method, url, *args, **kwargs)
requests.Session.request = patched_request

# Set India Region Catalyst API endpoints before importing the SDK
os.environ["X_ZOHO_CATALYST_IS_LOCAL"] = "true"
os.environ["X_ZOHO_CATALYST_CONSOLE_URL"] = "api.catalyst.zoho.in"
os.environ["X_ZOHO_CATALYST_ACCOUNTS_URL"] = "https://accounts.zoho.in"

import json
import time
import zcatalyst_sdk

# Monkeypatch Python SDK constants to use PROJECT-ID instead of PROJECT_ID header
import zcatalyst_sdk._constants
zcatalyst_sdk._constants.PROJECT_KEY_NAME = 'PROJECT-ID'

from zcatalyst_sdk import credentials
from zcatalyst_sdk.types import ICatalystOptions

# Load environment variables manually from .env.local or .env
def load_env():
    for filename in ['.env.local', '.env']:
        filepath = os.path.join(os.getcwd(), filename)
        if os.path.exists(filepath):
            print(f"Loading environment variables from {filename}...")
            with open(filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip().strip('"').strip("'")
                        os.environ[key] = val
            break

def main():
    load_env()
    
    # Required parameters
    client_id = os.environ.get("ZOHO_CATALYST_CLIENT_ID")
    client_secret = os.environ.get("ZOHO_CATALYST_CLIENT_SECRET")
    refresh_token = os.environ.get("ZOHO_CATALYST_REFRESH_TOKEN")
    project_id = os.environ.get("ZOHO_CATALYST_PROJECT_ID")
    zaid = os.environ.get("ZOHO_CATALYST_ZAID")
    
    if not all([client_id, client_secret, refresh_token, project_id, zaid]):
        print("\n❌ Error: Missing required environment variables in your .env or .env.local file!")
        print("Please ensure the following variables are defined:")
        print(" - ZOHO_CATALYST_CLIENT_ID")
        print(" - ZOHO_CATALYST_CLIENT_SECRET")
        print(" - ZOHO_CATALYST_REFRESH_TOKEN")
        print(" - ZOHO_CATALYST_PROJECT_ID")
        print(" - ZOHO_CATALYST_ZAID\n")
        return

    cred = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token
    }
    
    catalyst_credential = credentials.RefreshTokenCredential(cred)
    catalyst_options = ICatalystOptions(
        project_id=project_id,
        project_key=zaid,
        project_domain="api.catalyst.zoho.in",
        environment="Development"
    )
    
    print("Connecting to Zoho Catalyst...")
    try:
        app = zcatalyst_sdk.initialize_app(
            credential=catalyst_credential, 
            options=catalyst_options
        )
        datastore = app.datastore()
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        return

    # Load local relational data
    json_path = os.path.join(os.getcwd(), 'public', 'sample_fir_data.json')
    if not os.path.exists(json_path):
        print(f"❌ Error: data file not found at {json_path}")
        return
        
    print(f"Reading local database: {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        db_payload = json.load(f)

    # List of tables to import in order of dependency
    tables = [
        "Unit",
        "CaseMaster",
        "ComplainantDetails",
        "Victim",
        "Accused",
        "ArrestSurrender",
        "ActSectionAssociation",
        "FinancialTransactions"
    ]

    for table_name in tables:
        records = db_payload.get(table_name, [])
        if not records:
            print(f"No records found for table '{table_name}'. Skipping.")
            continue
            
        print(f"\n📂 Importing {len(records)} rows into '{table_name}'...")
        table_instance = datastore.table(table_name)
        
        # Batch size for uploads
        batch_size = 100
        total_inserted = 0
        
        for i in range(0, len(records), batch_size):
            chunk = records[i:i + batch_size]
            
            # Clean data fields (e.g. remove empty keys or cast types if necessary)
            cleaned_chunk = []
            for row in chunk:
                # Catalyst columns are case-sensitive.
                cleaned_row = {k: v for k, v in row.items() if v is not None}
                cleaned_chunk.append(cleaned_row)
                
            retries = 3
            while retries > 0:
                try:
                    table_instance.insert_rows(cleaned_chunk)
                    total_inserted += len(cleaned_chunk)
                    print(f"  ⚡ Uploaded {total_inserted}/{len(records)} rows...")
                    break
                except Exception as e:
                    retries -= 1
                    print(f"  ⚠️ Batch failed ({e}). Retrying... ({retries} left)")
                    time.sleep(2)
            else:
                print(f"❌ Failed to import a batch in table {table_name}. Stopping.")
                return
                
        print(f"✅ Table '{table_name}' successfully populated!")

    print("\n🎉 Database fully populated on Zoho Catalyst!")

if __name__ == '__main__':
    main()
