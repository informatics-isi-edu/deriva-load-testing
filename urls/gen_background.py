#!/usr/bin/python3

import json
import sys
import os
from deriva.core import ErmrestCatalog, HatracStore, AttrDict, get_credential, DEFAULT_CREDENTIAL_FILE, tag, urlquote, DerivaServer, get_credential, BaseCLI

from deriva.utils.extras.data import get_ermrest_query, insert_if_not_exist, update_table_rows, delete_table_rows
from deriva.utils.extras.shared import ConfigCLI, cfg, DCCTX

# Background selection: which pdb_00009a3q_minimal_v2_<rank>.cif files to use, and how many
# boxes to split them across. _00 is reserved for the main user, so background uses 01..48.
# 48 ranks / 4 boxes = 12 pairs per box -> up to 12 sessions per box (partition-size 2), so
# 48 background sessions total. To support more users, raise RANK_END (e.g. 96 -> 24 per box).
RANK_START = 1
RANK_END = 48
NUM_BOXES = 4


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
                    rank_start=RANK_START, rank_end=RANK_END, num_boxes=NUM_BOXES,
                    output_dir=None):

    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(__file__))

    rows = get_ermrest_query(catalog, "PDB", "entry", constraints=f'mmCIF_File_Name::regexp::{fname_prefix}/S:=left(id)=(PDB:struct:entry_id)',
                             keys=["M:RID"], attributes=["M:mmCIF_File_Name", "struct_rid:=S:RID"])

    # Select the wanted ranks. Parse the rank as an int and sort on it, never on the filename
    # string, so _100 sorts after _99 instead of right after _09.
    selected = []
    for row in rows:
        fname = row["mmCIF_File_Name"]
        if fname in exclude_fnames: continue
        try:
            rank = int(fname.rsplit(".cif", 1)[0].rsplit("_", 1)[1])
        except (IndexError, ValueError):
            continue
        if rank < rank_start or rank > rank_end: continue
        if not row["struct_rid"]:
            print("skip %s (rank %d): no matching PDB:struct row" % (fname, rank))
            continue
        selected.append((rank, row))
    selected.sort(key=lambda x: x[0])

    expected = rank_end - rank_start + 1
    if len(selected) != expected:
        missing = sorted(set(range(rank_start, rank_end + 1)) - {r for r, _ in selected})
        print("WARNING: expected %d entries (ranks %d..%d), got %d. missing: %s"
              % (expected, rank_start, rank_end, len(selected), missing))

    # Build record + recordedit pairs in numeric rank order.
    pairs = []
    for rank, row in selected:
        rid, struct_rid = row["RID"], row["struct_rid"]
        record = {
            "url": f'/record/#{catalog_id}/PDB:entry/RID={rid}',
            "app": "record",
            "identifier": f"PDB:entry/RID={rid}",
            "schema_table": "PDB:entry",
            "filter": f"RID={rid}",
        }
        edit = {
            "url": f"/recordedit/#{catalog_id}/PDB:struct/RID={struct_rid}",
            "app": "recordedit",
            "identifier": f"edit-with-change PDB:struct/RID={struct_rid}",
            "schema_table": "PDB:struct",
            "filter": f"RID={struct_rid}",
            "action": "submit",
            "inputs": [
                { "name": "pdbx_details", "value": "background load test edit {run}-{ts}" }
            ]
        }
        pairs.append((rank, [record, edit]))

    # Combined pool (all pairs, flat) for reference.
    combined = [entry for _, pair in pairs for entry in pair]
    dump_json_to_file(os.path.join(output_dir, "pdb-background-urls.json"), combined)

    # Split into num_boxes contiguous, disjoint files (box 01 = lowest ranks, and so on).
    n = len(pairs)
    base, extra = divmod(n, num_boxes)
    start = 0
    for b in range(1, num_boxes + 1):
        size = base + (1 if b <= extra else 0)
        chunk = pairs[start:start + size]
        start += size
        flat = [entry for _, pair in chunk for entry in pair]
        fname = f"pdb-background-urls-4box-{b:02d}.json"
        dump_json_to_file(os.path.join(output_dir, fname), flat)
        rng = "%d..%d" % (chunk[0][0], chunk[-1][0]) if chunk else "empty"
        print("wrote %s: %d pairs (ranks %s), %d urls" % (fname, len(chunk), rng, len(flat)))

    print("combined pool: %d pairs / %d urls -> pdb-background-urls.json" % (n, len(combined)))

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
