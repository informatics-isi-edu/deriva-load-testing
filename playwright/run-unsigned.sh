#!/bin/bash

export LOAD_TEST_SIGNED=false
export LOAD_TEST_RUN_COUNT=10
export LOAD_TEST_PAGE_SIZE=100
export LOAD_TEST_CHAISE_URL="https://staging.atlas-d2k.org/chaise/recordset/#2/Gene_Expression:Image/Thumbnail_Bytes::gt::1024@sort(RID)"
export LOAD_TEST_ERMREST_MAIN_URL_PREFIX="https://staging.atlas-d2k.org/ermrest/catalog/2/attributegroup/M:=Gene_Expression:Image/Thumbnail_Bytes::gt::1024"
export LOAD_TEST_HATRAC_URL_PREFIX="https://staging.atlas-d2k.org/hatrac/resources/gene_expression"

npx playwright test image.spec.ts
