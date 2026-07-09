#!/usr/bin/python3

import json
import sys
import os
from deriva.core import ErmrestCatalog, HatracStore, AttrDict, get_credential, DEFAULT_CREDENTIAL_FILE, tag, urlquote, DerivaServer, get_credential, BaseCLI

from deriva.utils.extras.data import get_ermrest_query, insert_if_not_exist, update_table_rows, delete_table_rows
from deriva.utils.extras.shared import ConfigCLI, cfg, DCCTX

def dump_json_to_file(file_path, json_object):
    """Dump a json object to a file
    
        Args:
            file_path (str): file path to dump the json object to
            json_object (obj): json compatible object

        """
    #print("dump_json_to_file: file_path %s" % (file_path))
    fw = open(file_path, 'w')
    json.dump(json_object, fw, indent=4)
    fw.write(f'\n')
    fw.close()
    
def gen_pdb_payload(catalog, catalog_id, fname_prefix="pdb_00009a3q_minimal_v2",
                    exclude_fnames=["pdb_00009a3q_minimal_v2_00.cif", "pdb_00009a3q_minimal_v2.cif"],
                    output_fpath="/tmp/background.json"):
    
    payload = []
    rows = get_ermrest_query(catalog, "PDB", "entry", constraints=f'mmCIF_File_Name::regexp::{fname_prefix}/S:=left(id)=(PDB:struct:entry_id)',
                             keys=["M:RID"], attributes=["M:mmCIF_File_Name", "struct_rid:=S:RID"])

    for row in rows:
        if row["mmCIF_File_Name"] in exclude_fnames: continue
        frank = row["mmCIF_File_Name"].rsplit(".cif")[0].rsplit("_", 1)[1]
        if int(frank) >= 40: continue
        rid = row["RID"]
        # == record
        tname = "PDB:entry"
        payload.append({
            "url": f'/record/#{catalog_id}/{tname}/RID={rid}',
            "app": "record",
            "identifier": f"{tname}/RID={rid}",
            "schema_table": tname,
            "filter": f"RID={rid}",
        })

        # == recordedit
        struct_rid = row["struct_rid"]
        tname = "PDB:struct"        
        if not struct_rid : continue
        payload.append({
            "url": f"/recordedit/#{catalog_id}/{tname}/RID={struct_rid}",
            "app": "recordedit",
            "identifier": f"edit-with-change {tname}/RID={struct_rid}",
            "schema_table": tname,
            "filter": f"RID={struct_rid}",
            "action": "submit",
            "inputs": [
                { "name": "Description", "value": "load test edit {run}-{ts}" }
            ]
        })
        
    print("records[%d]: %s" % (len(payload), json.dumps(payload[0:2], indent=4)))
    dump_json_to_file(output_fpath, payload)

def main(args):
    credentials = get_credential(args.host, args.credential_file)
    print("credentials: %s" % (credentials))
    catalog = ErmrestCatalog("https", args.host, args.catalog_id, credentials)
    catalog.dcctx['cid'] = DCCTX["cli"]
    #store = HatracStore("https", args.host, credentials)
    gen_pdb_payload(catalog, args.catalog_id)
    

# running the script:
# >python gen_background.py --host data-dev.pdb-ihm.org --catalog-id 99
#
if __name__ == "__main__":
    cli = ConfigCLI("pdb", None, 1)
    #cli.parser.add_argument('--verbose', action="store_true", help="flag whether to print progress/status", default=False)
    args = cli.parse_cli()
    main(args)
    
















