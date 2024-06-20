const REPORT_TABLES = {
  SIGNED: 'https://dev.derivacloud.org/ermrest/catalog/83773/entity/load-testing:signed_url_experiment',
  UNSIGNED: 'https://dev.derivacloud.org/ermrest/catalog/83773/entity/load-testing:unsigned_url_experiment',
  CHAISE_PERFORMANCE: 'https://dev.derivacloud.org/ermrest/catalog/83773/entity/load-testing:chaise_performance_experiment'
};

const SERVER_LOCATION = 'https://staging.atlas-d2k.org';

const CHAISE_PERFORMANCE_URLS = [
  {
    url: '/chaise/recordset/#2/Common:Gene/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM4gEEIBPAfQBEwAXMEAGhCwAsUBLXJOeKjNHAXQC+QoA@sort(RID)',
    app: 'recordset',
    identifier: 'Common:Gene/Any_Data=true'
  },
  {
    url: '/chaise/recordset/#2/Cell_Line:Reporter_Cell_Line',
    app: 'recordset',
    identifier: 'Cell_Line:Reporter_Cell_Line'
  },
  {
    url: '/chaise/recordset/#2/Gene_Expression:Specimen',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen'
  },
  {
    url: '/chaise/recordset/#2/RNASeq:Study/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JAEsIAjdafEAJQDkBBAZRwEcQAaEANUKTTABtCALzAAXQiggB9BqLRQAnlIBmAaxwKQAXQC+bUOlFk0FBNXpNWHbrwHCxE6Tb6CR4yVLoAHL4KwOPNQ1tPWoASQARbQ4IFFEpCDR+fjhRDDQcHV0gA',
    // url: '[{"type":"set", "s_t":"RNASeq:Study", "filters":{"and":[{"not_null":true, "src":[{"i":["RNASeq", "Visualization_Study_fkey"]}, {"o":["RNASeq", "Visualization_Visualization_Application_fkey"]}, "RID"]}]}}]',
    app: 'recordset',
    identifier: 'RNASeq:Study/has-single-cell-viz'
  },
  {
    url: '/chaise/recordset/#2/Protocol:Protocol',
    app: 'recordset',
    identifier: 'Protocol:Protocol'
  },
  {
    url: '/chaise/record/#2/RNASeq:Study/RID=W-RAHW',
    app: 'record',
    identifier: 'RNASeq:Study/RID=W-RAHW'
  },
  {
    url: '/chaise/recordset/#2/Common:Collection',
    app: 'recordset',
    identifier: 'Common:Collection'
  },
  {
    url: '/chaise/recordset/#2/Gene_Expression:Specimen/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAcRwhwH0BRADwAcMckkBLFCEADQgAyqxxZuAW1r0AglzABPegBVFY+gDMA1jkUgAugF8hAJQCSAEUNCsACxTdcSSgEYAbAFoATJYBipoZGxkA',
    // url: '[{"type":"set", "s_t":"Gene_Expression:Specimen", "filters":{"and":[{"src":[{"o":["Gene_Expression", "Specimen_Assay_Type_fkey"]}, "RID"], "ch":["16-2DFR"]}]}}]',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen/Assay_Type=ISH'
  },
  {
    url: '/chaise/record/#2/RNASeq:Experiment/RID=14-4KPM',
    app: 'record',
    identifier: 'RNASeq:Experiment/RID=14-4KPM'
  },
  // {
  //   url: '/chaise/record/#2/RNASeq:Study/RID=17-HW4W', // TODO has issues
  //   app: 'record',
  //   identifier: 'RNASeq:Study/RID=17-HW4W'
  // },
  {
    url: '/chaise/recordset/#2/RNASeq:Study/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JAEsIAjdafEAJQDkBBAZRwEcQAaEAUQA8AHHDIQC2OCABcA+gzFooATwlUAkgBEJAMwDWOOSAC6AXzah0YsmgoJq9Jqw49+gkeIkOBw0ZIAqc-hu26hhzKKvocWAAWKIS4SJQAigC0AJoAUskATOwgAIwAbInxANI0XvoGhkA',
    // url: '[{"type":"set", "s_t":"RNASeq:Study", "filters":{"and":[{"src":[{"i":["RNASeq", "Experiment_Study_RID_fkey"]}, {"o":["RNASeq", "Experiment_Experiment_Type_fkey"]}, "RID"], "ch":["16-QKNT", "Q-YJY2"]}]}}]',
    app: 'recordset',
    identifier: 'RNASeq:Study/Experiment_Type=snRNA-Seq,scRNA-Seq'
  },

  {
    url: '/chaise/record/#2/Cell_Line:Parental_Cell_Line/RID=Q-2D6W',
    app: 'record',
    identifier: 'Cell_Line:Parental_Cell_Line/RID=Q-2D6W'
  },
  {
    url: '/chaise/recordset/#2/Cell_Line:Parental_Cell_Line',
    app: 'recordset',
    identifier: 'Cell_Line:Parental_Cell_Line'
  },
  {
    url: '/chaise/recordset/#2/Gene_Expression:Specimen/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAcRwhwH0BRADwAcMckkBLFCEADQgAyqxxZuAW1r0AChm4QJrMABt6ASQgA3TkW4BzMERQZ6AMwDWOAJ4gAugF8hAJQ0ARB0KwALFN1wkSgBGAHYAWkYADgB1ABYHRycgA',
    // url: '[{"type":"set", "s_t":"Gene_Expression:Specimen", "filters":{"and":[{"src":[{"o":["Gene_Expression", "Specimen_Principal_Investigator_fkey"]}, "RID"], "ch":["17-E8W4"]}]}}]',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen/PI=xue-sean-li'
  },
  {
    url: '/chaise/recordset/#2/Vocabulary:Anatomy',
    app: 'recordset',
    identifier: 'Vocabulary:Anatomy'
  },
  {
    url: '/chaise/recordset/#2/RNASeq:Study/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JAEsIAjdafEAJQDkBBAZRwEcQAaEAUQA8AHHDIQC2OCABcA+gzFooATwlUAkgBEJAMwDWOOSAC6AXzah0YsmgoJq9Jqw49+gkeIkOBw0ZIAqc-hu26hhzKKvocWAAWKIS4SJQAigC0AJoAUgAaAOr6BoZAA',
    // url: '[{"type":"set", "s_t":"RNASeq:Study", "filters":{"and":[{"src":[{"i":["RNASeq", "Experiment_Study_RID_fkey"]}, {"o":["RNASeq", "Experiment_Experiment_Type_fkey"]}, "RID"], "ch":["Q-YJXW"]}]}}]',
    app: 'recordset',
    identifier: 'RNASeq:Study/Experiment_Type=mRNA-Seq'
  },
  {
    url: '/chaise/recordset/#2/RNASeq:Study',
    app: 'recordset',
    identifier: 'RNASeq:Study'
  },
  {
    url: '/chaise/record/#2/Common:Collection/RID=17-E76T',
    app: 'record',
    identifier: 'Common:Collection/RID=17-E76T'
  },
  // {
  //   url: '/chaise/record/#2/Gene_Expression:Specimen/RID=17-HVEW', // TODO has issues
  //   app: 'record',
  //   identifier: 'Gene_Expression:Specimen/RID=17-HVEW'
  // },
  // {
  //   url: '/chaise/record/#2/RNASeq:Study/RID=17-HC9Y', // TODO has issues
  //   app: 'record',
  //   identifier: 'RNASeq:Study/RID=17-HC9Y'
  // },
  {
    url: '/chaise/recordset/#2/Antibody:Antibody_Tests',
    app: 'recordset',
    identifier: 'Antibody:Antibody_Tests'
  },
  {
    url: '/chaise/record/#2/RNASeq:Study/RID=W-R812',
    app: 'record',
    identifier: 'RNASeq:Study/RID=W-R812'
  },
  {
    url: '/chaise/recordset/#2/Gene_Expression:Specimen/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAcRwhwH0BRADwAcMckkBLFCEADQgAyqxxZuAW1r0AglzABPegBVFY+gDMA1jkUgAugF8hAOTDTDQrAAsU3XEkoBJABIBhQ0eNA',
    // url: '[{"type":"set", "s_t":"Gene_Expression:Specimen", "filters":{"and":[{"src":[{"o":["Gene_Expression", "Specimen_Assay_Type_fkey"]}, "Name"], "ch":["IHC"]}]}}]',
    app: 'recordset',
    identifier: 'Gene_Expression:Specimen/Assay_Type=IHC'
  }
]


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

const shuffleChaisePerformanceURLs = (seed) => {
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

  return res;
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
  await page.locator('#rt-toc-loading').waitFor({ state: 'detached', timeout })
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
