#!/bin/bash
# NOTE don't forget to define LOAD_TEST_CLIENT_NAME and LOAD_TEST_AUTH_COOKIE before running this script

export LOAD_TEST_ERMREST_MAIN_URL_PREFIX="https://staging.atlas-d2k.org/ermrest/catalog/2/attributegroup/M:=Gene_Expression:Image/*::ciregexp::Thumbnail"
export LOAD_TEST_HATRAC_URL_PREFIX="https://staging.atlas-d2k.org/hatrac/resources/gene_expression"
export LOAD_TEST_HATRAC_REDIRECT_URL_PREFIX="https://vm012.hive.psc.edu:9000/atlas-d2k"

URLs=(
  #32K
  "https://staging.atlas-d2k.org/chaise/recordset/#2/Gene_Expression:Image/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCEjmNgBYC0ARigB4gA0p5Vc8IAKpWgLa0IYAJYAbagGYATAGkQAXQC+yoA@sort(RID)"
  #64K
  # "https://staging.atlas-d2k.org/chaise/recordset/#2/Gene_Expression:Image/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCEjmNgBYC0ARigB4gA0p5Vc8IAKpWgLa0IYAJYAbagDYALAGkQAXQC+yoA@sort(RID)"
  #128K
  # "https://staging.atlas-d2k.org/chaise/recordset/#2/Gene_Expression:Image/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCEjmNgBYC0ARigB4gA0p5Vc8IAKpWgLa0IYAJYAbagEYATAA4A0iAC6AX1VA@sort(RID)"
  #256K
  "https://staging.atlas-d2k.org/chaise/recordset/#2/Gene_Expression:Image/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCEjmNgBYC0ARigB4gA0p5Vc8IAKpWgLa0IYAJYAbagCYArADYA0iAC6AX1VA@sort(RID)"
  #512K
  # "https://staging.atlas-d2k.org/chaise/recordset/#2/Gene_Expression:Image/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCEjmNgBYC0ARigB4gA0p5Vc8IAKpWgLa0IYAJYAbagFYAjACYA0iAC6AX1VA@sort(RID)"
)

PAGE_SIZES=(
  25
  50
  100
  200
)

export LOAD_TEST_RUN_COUNT=10
export LOAD_TEST_SIGNED=true

echo "Running experiment with signed: $LOAD_TEST_SIGNED"

for URL in ${URLs[*]}
do
  for PAGE_SIZE in ${PAGE_SIZES[*]}
  do
    export LOAD_TEST_CHAISE_URL="$URL"
    export LOAD_TEST_PAGE_SIZE="$PAGE_SIZE"
    time npx playwright test image.spec.ts --workers 1
  done
done
