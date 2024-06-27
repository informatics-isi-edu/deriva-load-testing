const REPORT_TABLES = {
  SIGNED: 'https://dev.derivacloud.org/ermrest/catalog/cloud_testing/entity/load-testing:signed_url_experiment',
  UNSIGNED: 'https://dev.derivacloud.org/ermrest/catalog/cloud_testing/entity/load-testing:unsigned_url_experiment',
  CHAISE_PERFORMANCE: 'https://dev.derivacloud.org/ermrest/catalog/cloud_testing/entity/load-testing:chaise_performance_experiment'
};

const SERVER_LOCATION = 'https://staging.atlas-d2k.org/~ashafaei/chaise-load-testing/';

const CHAISE_PERFORMANCE_URLS = [
  {
    url: '/recordset/#2/Cell_Line:Parental_Cell_Line',
    app: 'recordset',
    identifier: 'Cell_Line:Parental_Cell_Line',
    schema_table: 'Cell_Line:Parental_Cell_Line',
    filter: ''
  },
  {
    url: '/recordset/#2/Gene_Expression:Specimen',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen',
    schema_table: 'Gene_Expression:Specimen',
    filter: ''
  },
  {
    url: '/record/#2/Cell_Line:Parental_Cell_Line/RID=Q-2D6W',
    app: 'record',
    identifier: 'Cell_Line:Parental_Cell_Line/RID=Q-2D6W',
    schema_table: 'Cell_Line:Parental_Cell_Line',
    filter: 'RID=Q-2D6W'
  },
  {
    url: '/record/#2/RNASeq:Study/RID=W-R812',
    app: 'record',
    identifier: 'RNASeq:Study/RID=W-R812',
    schema_table: 'RNASeq:Study',
    filter: 'RID=W-R812'
  }
];

const CHAISE_PERFORMANCE_URLS_ORIG = [
  {
    url: '/recordset/#2/Common:Gene/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM4gEEIBPAfQBEwAXMEAGhCwAsUBLXJOeKjNHAXQC+QoA@sort(RID)',
    app: 'recordset',
    identifier: 'Common:Gene/Any_Data=true',
    schema_table: 'Common:Gene',
    filter: 'Any_Data=true'
  },
  {
    url: '/recordset/#2/Gene_Expression:Specimen',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen',
    schema_table: 'Gene_Expression:Specimen',
    filter: ''
  },
  {
    url: '/recordset/#2/Cell_Line:Reporter_Cell_Line',
    app: 'recordset',
    identifier: 'Cell_Line:Reporter_Cell_Line',
    schema_table: 'Cell_Line:Reporter_Cell_Line',
    filter: ''
  },
  {
    url: '/recordset/#2/RNASeq:Study/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JAEsIAjdafEAJQDkBBAZRwEcQAaEANUKTTABtCALzAAXQiggB9BqLRQAnlIBmAaxwKQAXQC+bUOlFk0FBNXpNWHbrwHCxE6Tb6CR4yVLoAHL4KwOPNQ1tPWoASQARbQ4IFFEpCDR+fjhRDDQcHV0gA',
    // url: '[{"type":"set", "s_t":"RNASeq:Study", "filters":{"and":[{"not_null":true, "src":[{"i":["RNASeq", "Visualization_Study_fkey"]}, {"o":["RNASeq", "Visualization_Visualization_Application_fkey"]}, "RID"]}]}}]',
    app: 'recordset',
    identifier: 'RNASeq:Study/has-single-cell-viz',
    schema_table: 'RNASeq:Study',
    filter: 'has-single-cell-viz'
  },
  {
    url: '/recordset/#2/Common:Collection',
    app: 'recordset',
    identifier: 'Common:Collection',
    schema_table: 'Common:Collection',
    filter: ''
  },
  {
    url: '/recordset/#2/Protocol:Protocol',
    app: 'recordset',
    identifier: 'Protocol:Protocol',
    schema_table: 'Protocol:Protocol',
    filter: ''
  },
  {
    url: '/record/#2/RNASeq:Study/RID=W-RAHW',
    app: 'record',
    identifier: 'RNASeq:Study/RID=W-RAHW',
    schema_table: 'RNASeq:Study',
    filter: 'RID=W-RAHW'
  },
  {
    url: '/recordset/#2/Gene_Expression:Specimen/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAcRwhwH0BRADwAcMckkBLFCEADQgAyqxxZuAW1r0AglzABPegBVFY+gDMA1jkUgAugF8hAJQCSAEUNCsACxTdcSSgEYAbAFoATJYBipoZGxkA',
    // url: '[{"type":"set", "s_t":"Gene_Expression:Specimen", "filters":{"and":[{"src":[{"o":["Gene_Expression", "Specimen_Assay_Type_fkey"]}, "RID"], "ch":["16-2DFR"]}]}}]',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen/Assay_Type=ISH',
    schema_table: 'Gene_Expression:Specimen',
    filter: 'Assay_Type=ISH'
  },
  {
    url: '/record/#2/RNASeq:Experiment/RID=14-4KPM',
    app: 'record',
    identifier: 'RNASeq:Experiment/RID=14-4KPM',
    schema_table: 'RNASeq:Experiment',
    filter: 'Assay_Type=ISH'
  },
  {
    url: '/recordset/#2/RNASeq:Study/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JAEsIAjdafEAJQDkBBAZRwEcQAaEAUQA8AHHDIQC2OCABcA+gzFooATwlUAkgBEJAMwDWOOSAC6AXzah0YsmgoJq9Jqw49+gkeIkOBw0ZIAqc-hu26hhzKKvocWAAWKIS4SJQAigC0AJoAUskATOwgAIwAbInxANI0XvoGhkA',
    // url: '[{"type":"set", "s_t":"RNASeq:Study", "filters":{"and":[{"src":[{"i":["RNASeq", "Experiment_Study_RID_fkey"]}, {"o":["RNASeq", "Experiment_Experiment_Type_fkey"]}, "RID"], "ch":["16-QKNT", "Q-YJY2"]}]}}]',
    app: 'recordset',
    identifier: 'RNASeq:Study/Experiment_Type=snRNA-Seq,scRNA-Seq',
    schema_table: 'RNASeq:Study',
    filter: 'Experiment_Type=snRNA-Seq,scRNA-Seq'
  },
  // {
  //   url: '/record/#2/RNASeq:Study/RID=17-HW4W', // missing from staging
  //   app: 'record',
  //   identifier: 'RNASeq:Study/RID=17-HW4W',
  //   schema_table: 'RNASeq:Study/RID=17-HW4W',
  //   filter: 'RID=17-HW4W'
  // },
  {
    url: '/recordset/#2/Cell_Line:Parental_Cell_Line',
    app: 'recordset',
    identifier: 'Cell_Line:Parental_Cell_Line',
    schema_table: 'Cell_Line:Parental_Cell_Line',
    filter: ''
  },
  {
    url: '/record/#2/Cell_Line:Parental_Cell_Line/RID=Q-2D6W',
    app: 'record',
    identifier: 'Cell_Line:Parental_Cell_Line/RID=Q-2D6W',
    schema_table: 'Cell_Line:Parental_Cell_Line',
    filter: 'RID=Q-2D6W'
  },
  {
    url: '/recordset/#2/RNASeq:Study',
    app: 'recordset',
    identifier: 'RNASeq:Study',
    schema_table: 'RNASeq:Study',
    filter: ''
  },
  {
    url: '/recordset/#2/Gene_Expression:Specimen/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAcRwhwH0BRADwAcMckkBLFCEADQgAyqxxZuAW1r0AChm4QJrMABt6ASQgA3TkW4BzMERQZ6AMwDWOAJ4gAugF8hAJQ0ARB0KwALFN1wkSgBGAHYAWkYADgB1ABYHRycgA',
    // url: '[{"type":"set", "s_t":"Gene_Expression:Specimen", "filters":{"and":[{"src":[{"o":["Gene_Expression", "Specimen_Principal_Investigator_fkey"]}, "RID"], "ch":["17-E8W4"]}]}}]',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen/PI=xue-sean-li',
    schema_table: 'Gene_Expression:Specimen',
    filter: 'PI=xue-sean-li'
  },
  {
    url: '/recordset/#2/RNASeq:Study/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JAEsIAjdafEAJQDkBBAZRwEcQAaEAUQA8AHHDIQC2OCABcA+gzFooATwlUAkgBEJAMwDWOOSAC6AXzah0YsmgoJq9Jqw49+gkeIkOBw0ZIAqc-hu26hhzKKvocWAAWKIS4SJQAigC0AJoAUgAaAOr6BoZAA',
    // url: '[{"type":"set", "s_t":"RNASeq:Study", "filters":{"and":[{"src":[{"i":["RNASeq", "Experiment_Study_RID_fkey"]}, {"o":["RNASeq", "Experiment_Experiment_Type_fkey"]}, "RID"], "ch":["Q-YJXW"]}]}}]',
    app: 'recordset',
    identifier: 'RNASeq:Study/Experiment_Type=mRNA-Seq',
    schema_table: 'RNASeq:Study',
    filter: 'Experiment_Type=mRNA-Seq'
  },
  {
    url: '/record/#2/Common:Collection/RID=17-E76T',
    app: 'record',
    identifier: 'Common:Collection/RID=17-E76T',
    schema_table: 'Common:Collection',
    filter: 'RID=17-E76T'
  },
  {
    url: '/recordset/#2/Vocabulary:Anatomy',
    app: 'recordset',
    identifier: 'Vocabulary:Anatomy',
    schema_table: 'Vocabulary:Anatomy',
    filter: ''
  },
  {
    url: '/record/#2/RNASeq:Study/RID=W-R812',
    app: 'record',
    identifier: 'RNASeq:Study/RID=W-R812',
    schema_table: 'RNASeq:Study',
    filter: 'RID=W-R812'
  },
  {
    url: '/record/#2/RNASeq:Study/RID=17-HC9Y', // was not released on staging, so we manually changed it
    app: 'record',
    identifier: 'RNASeq:Study/RID=17-HC9Y',
    schema_table: 'RNASeq:Study',
    filter: 'RID=17-HC9Y'
  },
  {
    url: '/recordset/#2/Common:Protein',
    app: 'recordset',
    identifier: 'Common:Protein',
    schema_table: 'Common:Protein',
    filter: ''
  },
  // {
  //   url: '/record/#2/Gene_Expression:Specimen/RID=17-HVEW', // missing from staging
  //   app: 'record',
  //   identifier: 'Gene_Expression:Specimen/RID=17-HVEW',
  //   schema_table: 'Gene_Expression:Specimen',
  //   filter: 'RID=17-HVEW'
  // },
  {
    url: '/recordset/#2/Antibody:Antibody_Tests',
    app: 'recordset',
    identifier: 'Antibody:Antibody_Tests',
    schema_table: 'Antibody:Antibody_Tests',
    filter: ''
  },
  {
    url: '/recordset/#2/Gene_Expression:Specimen/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAcRwhwH0BRADwAcMckkBLFCEADQgAyqxxZuAW1r0AglzABPegBVFY+gDMA1jkUgAugF8hAOTDTDQrAAsU3XEkoBJABIBhQ0eNA',
    // url: '[{"type":"set", "s_t":"Gene_Expression:Specimen", "filters":{"and":[{"src":[{"o":["Gene_Expression", "Specimen_Assay_Type_fkey"]}, "Name"], "ch":["IHC"]}]}}]',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen/Assay_Type=IHC',
    schema_table: 'Gene_Expression:Specimen',
    filter: 'Assay_Type=IHC'
  },
  {
    url: '/recordset/#2/Gene_Expression:Specimen/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAcRwhwH0BRADwAcMckkBLFCEADQgAyqxxZuAW1r0AglzABPegBVFY+gDMA1jkUgAugF8hAJQCSAEUNCsACxTdcSSgEYAbAFoATJaqzDI2MgA',
    // url: '[{"type":"set", "s_t":"Gene_Expression:Specimen", "filters":{"and":[{"src":[{"o":["Gene_Expression", "Specimen_Assay_Type_fkey"]}, "Name"], "ch":["Histology"]}]}}]',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen/Assay_Type=Histology',
    schema_table: 'Gene_Expression:Specimen',
    filter: 'Assay_Type=Histology'
  },
  {
    url: '/record/#2/Gene_Expression:Image/RID=16-ZHTP',
    app: 'record',
    identifier: 'Gene_Expression:Image/RID=16-ZHTP',
    schema_table: 'Gene_Expression:Image',
    filter: 'RID=16-ZHTP'
  },
  {
    url: '/record/#2/RNASeq:Experiment/RID=14-4KBC',
    app: 'record',
    identifier: 'RNASeq:Experiment/RID=14-4KBC',
    schema_table: 'RNASeq:Experiment',
    filter: 'RID=14-4KBC'
  },
  {
    url: '/record/#2/Common:Collection/RID=14-4KG6',
    app: 'record',
    identifier: 'Common:Collection/RID=14-4KG6',
    schema_table: 'Common:Collection',
    filter: 'RID=14-4KG6'
  },
  {
    url: '/record/#2/RNASeq:Study/RID=16-WHYA',
    app: 'record',
    identifier: 'RNASeq:Study/RID=16-WHYA',
    schema_table: 'RNASeq:Study',
    filter: 'RID=16-WHYA'
  },
  {
    url: '/record/#2/RNASeq:Experiment/RID=14-4KBE',
    app: 'record',
    identifier: 'RNASeq:Experiment/RID=14-4KBE',
    schema_table: 'RNASeq:Experiment',
    filter: 'RID=14-4KBE'
  },
  {
    url: '/record/#2/Common:Collection/RID=W-R8CM',
    app: 'record',
    identifier: 'Common:Collection/RID=W-R8CM',
    schema_table: 'Common:Collection',
    filter: 'RID=W-R8CM'
  },
  {
    url: '/recordset/#2/Gene_Expression:Specimen/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAcRwhwH0BRADwAcMckkBLFCEADQgAyqxxZuAW1r1R47p3oAzANY4AniAC6AXyEAlAJIARbUKwALFN1xJKARgAsAWkcBZAGL7te5Omx4CKDEZGgUCNS0DCzsnDx8giJiEtIQ9MY4AG44ADYorKlEYDmyRQDmDKoaPgYmZiCW1rYOAGzOACoAglQADDV+mLj4wWik5DARNHRMbBxcvPxCcikyAAoY3BASrMX0hhDZSETcZWBEKBjKapq6taZa5lY2nJQA6s76ABwAzJ0+ukA',
    // url: '[{"type":"set", "s_t":"Gene_Expression:Specimen", "filters":{"and":[{"src":[{"o":["Gene_Expression", "Specimen_Species_fkey"]}, "RID"], "ch":["14-4MFR"]}, {"src":[{"o":["Gene_Expression", "Specimen_Developmental_Stage_fkey"]}, "RID"], "ch":["16-TAG0"]}, {"src":[{"o":["Gene_Expression", "Specimen_Principal_Investigator_fkey"]}, "RID"], "ch":["W-R83A"]}]}}]',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen/Species=Homo_Sapiens,Stage=Adult_Human,PI=Douglas_Strand',
    schema_table: 'Gene_Expression:Specimen',
    filter: 'Species=Homo_Sapiens,Stage=Adult_Human,PI=Douglas_Strand'
  },
  {
    url: '/record/#2/RNASeq:Study/RID=17-E9P0',
    app: 'record',
    identifier: 'RNASeq:Study/RID=17-E9P0',
    schema_table: 'RNASeq:Study',
    filter: 'RID=17-E9P0'
  },
  {
    url: '/record/#2/RNASeq:Study/RID=14-4KBA',
    app: 'record',
    identifier: 'RNASeq:Study/RID=14-4KBA',
    schema_table: 'RNASeq:Study',
    filter: 'RID=14-4KBA'
  },
  {
    url: '/record/#2/Common:Collection/RID=17-E9J6',
    app: 'record',
    identifier: 'Common:Collection/RID=17-E9J6',
    schema_table: 'Common:Collection',
    filter: 'RID=17-E9J6'
  },
  {
    url: '/record/#2/Common:Collection/RID=17-3ZHJ',
    app: 'record',
    identifier: 'Common:Collection/RID=17-3ZHJ',
    schema_table: 'Common:Collection',
    filter: 'RID=17-3ZHJ'
  },
  {
    url: '/recordset/#2/RNASeq:Experiment',
    app: 'recordset',
    identifier: 'RNASeq:Experiment',
    schema_table: 'RNASeq:Experiment',
    filter: ''
  },
  {
    url: '/recordset/#2/Common:Publication',
    app: 'recordset',
    identifier: 'Common:Publication',
    schema_table: 'Common:Publication',
    filter: ''
  },
  {
    url: '/record/#2/Common:Collection/RID=17-DRBC',
    app: 'record',
    identifier: 'Common:Collection/RID=17-DRBC',
    schema_table: 'Common:Collection',
    filter: 'RID=17-DRBC'
  },
  {
    url: '/record/#2/Cell_Line:Reporter_Cell_Line/RID=Q-2CW2',
    app: 'record',
    identifier: 'Cell_Line:Reporter_Cell_Line/RID=Q-2CW2',
    schema_table: 'Cell_Line:Reporter_Cell_Line',
    filter: 'RID=Q-2CW2'
  },
  {
    url: '/record/#2/Common:Collection/RID=16-X2BE',
    app: 'record',
    identifier: 'Common:Collection/RID=16-X2BE',
    schema_table: 'Common:Collection',
    filter: 'RID=16-X2BE'
  },
  {
    url: '/record/#2/RNASeq:Study/RID=16-1YZM',
    app: 'record',
    identifier: 'RNASeq:Study/RID=16-1YZM',
    schema_table: 'RNASeq:Study',
    filter: 'RID=16-1YZM'
  },
  {
    url: '/record/#2/Protocol:Protocol/RID=17-H31R',
    app: 'record',
    identifier: 'Protocol:Protocol/RID=17-H31R',
    schema_table: 'Protocol:Protocol',
    filter: 'RID=17-H31R'
  },
  {
    url: '/record/#2/Gene_Expression:Specimen/RID=16-X33J',
    app: 'record',
    identifier: 'Gene_Expression:Specimen/RID=16-X33J',
    schema_table: 'Gene_Expression:Specimen',
    filter: 'RID=16-X33J'
  },
  {
    url: '/recordset/#2/RNASeq:Study/Consortium=RBK',
    app: 'recordset',
    identifier: 'RNASeq:Study/Consortium=RBK',
    schema_table: 'RNASeq:Study',
    filter: 'Consortium=RBK'
  },
  {
    url: '/recordset/#2/Gene_Expression:Specimen/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAcRwhwH0BRADwAcMckkBLFCEADQgAyqxxZuAW1r1R47p3oAzANY4AniAC6AXyEAlAJIARbUKwALFN1xJKARgAsAWkcBZAGL7te5Omx4CKDEZGgUCNS0DCzsnDx8giJiEtIQ9MY4AG44ADYorKlEYDmyRQDmDKoaPgYmZiCW1rYOAGzOACoAglQADD66QA',
    // url: '[{"type":"set", "s_t":"Gene_Expression:Specimen", "filters":{"and":[{"src":[{"o":["Gene_Expression", "Specimen_Species_fkey"]}, "RID"], "ch":["14-4MFR"]}, {"src":[{"o":["Gene_Expression", "Specimen_Developmental_Stage_fkey"]}, "RID"], "ch":["16-TAG0"]}]}}]',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen/Species=Homo_Sapiens,Stage=Adult_Human',
    schema_table: 'Gene_Expression:Specimen',
    filter: 'Species=Homo_Sapiens,Stage=Adult_Human'
  },
  {
    url: '/recordset/#2/Schematics:Schematic_Group',
    app: 'recordset',
    identifier: 'Schematics:Schematic_Group',
    schema_table: 'Schematics:Schematic_Group',
    filter: ''
  },
  {
    url: '/record/#2/Common:Collection/RID=16-2MTM',
    app: 'record',
    identifier: 'Common:Collection/RID=16-2MTM',
    schema_table: 'Common:Collection',
    filter: 'RID=16-2MTM'
  },
  // {
  //   url: '/record/#2/Gene_Expression:Specimen/RID=17-HVF2', // missing from staging
  //   app: 'record',
  //   identifier: 'Gene_Expression:Specimen/RID=17-HVF2',
  //   schema_table: 'Gene_Expression:Specimen',
  //   filter: 'RID=17-HVF2'
  // },
  {
    url: '/record/#2/Gene_Expression:Specimen/RID=16-WHPG',
    app: 'record',
    identifier: 'Gene_Expression:Specimen/RID=16-WHPG',
    schema_table: 'Gene_Expression:Specimen',
    filter: 'RID=16-WHPG'
  }
];


/**
 * given a seed, will return a pseudp-random integer from 0 to inclusive max.
 * https://stackoverflow.com/a/19303725
 * @param {number} seed any number expect 0 (or any multiple of Math.PI)
 * @param {number} max the maximum value (integer)
 * @returns
 */
const getRandomIntWithSeed = (seed, max) => {
  var x = Math.tan(seed++) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

/**
 * return a random integer from 0 to inclusive max.
 * @param {number} max the maximum value (integer)
 */
const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
}

/**
 *
 * @param {number} start
 * @param {number} end
 * @returns
 */
const interval = (start, end) => {
  return end - start;
}

/**
 * convert a given date to los angeles locale
 */
const convertDateToLocal = (date) => {
  return new Date(date).toLocaleString("en-US", { timeZone: 'America/Los_Angeles' })
}

const pickARandomChaisePerformanceURL = (seed) => {
  if (isNaN(seed)) {
    seed = getRandomInt(CHAISE_PERFORMANCE_URLS.length);
  }

  const indx = getRandomIntWithSeed(seed, CHAISE_PERFORMANCE_URLS.length);
  return CHAISE_PERFORMANCE_URLS[indx];
}

const shuffleChaisePerformanceURLs = (seed, count) => {
  let res = [...CHAISE_PERFORMANCE_URLS];
  let m = res.length, t, i;

  while (m) {
    // Pick a remaining element…
    i = Math.floor(getRandomIntWithSeed(seed, 1) * m--);

    // And swap it with the current element.
    t = res[m];
    res[m] = res[i];
    res[i] = t;
    ++seed;
  }

  let maxCount = res.length;
  if (Number.isInteger(count)) {
    maxCount = count;
  }
  return res.slice(0, maxCount);
}

/********************** wait and locator functions ************************/

const waitForMultipleDetached = async (locator, timeout) => {
  const cnt = await locator.count();
  for (let i = 0; i < cnt; i++) {
    await locator.nth(i).waitFor({ state: 'detached' }, timeout);
  }
}

const waitForNavbar = async (page, timeout) => {
  await page.locator('#mainnav').waitFor({ state: 'visible' }, timeout);
}

/**
 * wait for recordset main data
 */
const waitForRecordsetMainData = async (page, timeout) => {
  await page.locator('.recordset-table').waitFor({ state: 'visible' }, timeout);
  await page.locator('.recordest-main-spinner').waitFor({ state: 'detached' }, timeout);
}

const waitForRecordsetSecondaryData = async (page, timeout) => {
  await waitForMultipleDetached(page.locator('.facet-header-icon .facet-spinner'), timeout);
  await waitForMultipleDetached(page.locator('.table-column-spinner'), timeout);
}

const waitForRecordMainData = async (page, timeout) => {
  await page.locator('.entity-title').waitFor({ state: 'visible', timeout });
  await page.locator('.record-main-section-table').waitFor({ state: 'visible', timeout });
};

const waitForRecordSecondaryData = async (page, timeout) => {
  await page.locator('.related-section-spinner').waitFor({ state: 'detached', timeout })
};

/**
 * wait for all images on the page to load
 * @param {Page} page
 * @param {number?} timeout
 */
const waitForImages = async (page, timeout) => {
  /**
   * wait for thumbnails to load
   * https://github.com/microsoft/playwright/issues/6046
   */
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.every(img => img.complete && img.naturalWidth !== 0);
  }, undefined, { timeout });
};


// NOTE we have to use this syntax since this file is also used by artillery
module.exports = {
  SERVER_LOCATION,
  REPORT_TABLES,
  getRandomInt,
  getRandomIntWithSeed,
  interval,
  convertDateToLocal,
  pickARandomChaisePerformanceURL,
  shuffleChaisePerformanceURLs,
  waitForNavbar,
  waitForRecordsetMainData,
  waitForRecordsetSecondaryData,
  waitForRecordMainData,
  waitForRecordSecondaryData,
  waitForImages,
}
