/**
 * Finnish Translations
 * <tuomas.salo (at) iki.fi>
 * 'ä' should read as lowercase 'a' with two dots on top (&auml;)
 */
Ext.onReady(function () {
  if (Ext.Date) {
    Ext.Date.monthNames = [
      "tammikuu",
      "helmikuu",
      "maaliskuu",
      "huhtikuu",
      "toukokuu",
      "kesäkuu",
      "heinäkuu",
      "elokuu",
      "syyskuu",
      "lokakuu",
      "marraskuu",
      "joulukuu"
    ];

    Ext.Date.getShortMonthName = function (month) {
      return month + 1 + ".";
    };

    Ext.Date.monthNumbers = {
      tammikuu: 0,
      helmikuu: 1,
      maaliskuu: 2,
      huhtikuu: 3,
      toukokuu: 4,
      kesäkuu: 5,
      heinäkuu: 6,
      elokuu: 7,
      syyskuu: 8,
      lokakuu: 9,
      marraskuu: 10,
      joulukuu: 11
    };

    Ext.Date.getMonthNumber = function (name) {
      if (name.match(/^(1?\d)\./)) {
        return -1 + RegExp.$1;
      } else {
        return Ext.Date.monthNumbers[name];
      }
    };

    Ext.Date.dayNames = [
      "sunnuntai",
      "maanantai",
      "tiistai",
      "keskiviikko",
      "torstai",
      "perjantai",
      "lauantai"
    ];

    Ext.Date.getShortDayName = function (day) {
      return Ext.Date.dayNames[day].substring(0, 2);
    };
  }

  if (Ext.util && Ext.util.Format) {
    Ext.apply(Ext.util.Format, {
      thousandSeparator: ".",
      decimalSeparator: ",",
      currencySign: "\u20ac",
      // Finnish Euro
      dateFormat: "j.n.Y"
    });

    Ext.util.Format.date = function (v, format) {
      if (!v) return "";
      if (!(v instanceof Date)) v = new Date(Date.parse(v));
      return Ext.Date.format(v, format || "j.n.Y");
    };
  }
});

Ext.define("Ext.locale.fi.view.View", {
  override: "Ext.view.View",
  emptyText: ""
});

Ext.define("Ext.locale.fi.grid.plugin.DragDrop", {
  override: "Ext.grid.plugin.DragDrop",
  dragText: "{0} rivi(ä) valittu"
});

Ext.define("Ext.locale.fi.tab.Tab", {
  override: "Ext.tab.Tab",
  closeText: "Sulje tämä välilehti"
});

// changing the msg text below will affect the LoadMask
Ext.define("Ext.locale.fi.view.AbstractView", {
  override: "Ext.view.AbstractView",
  loadingText: "Ladataan..."
});

Ext.define("Ext.locale.fi.picker.Date", {
  override: "Ext.picker.Date",
  todayText: "Tänään",
  minText: "Tämä päivämäärä on aikaisempi kuin ensimmäinen sallittu",
  maxText: "Tämä päivämäärä on myöhäisempi kuin viimeinen sallittu",
  disabledDaysText: "",
  disabledDatesText: "",
  nextText: "Seuraava kuukausi (Control+oikealle)",
  prevText: "Edellinen kuukausi (Control+vasemmalle)",
  monthYearText:
    "Valitse kuukausi (vaihda vuotta painamalla Control+ylös/alas)",
  todayTip: "{0} (välilyönti)",
  format: "j.n.Y",
  startDay: 1 // viikko alkaa maanantaista
});

Ext.define("Ext.locale.fi.picker.Month", {
  override: "Ext.picker.Month",
  okText: "&#160;OK&#160;",
  cancelText: "Peruuta"
});

Ext.define("Ext.locale.fi.toolbar.Paging", {
  override: "Ext.PagingToolbar",
  beforePageText: "Sivu",
  afterPageText: "/ {0}",
  firstText: "Ensimmäinen sivu",
  prevText: "Edellinen sivu",
  nextText: "Seuraava sivu",
  lastText: "Viimeinen sivu",
  refreshText: "Päivitä",
  displayMsg: "Näytetään {0} - {1} / {2}",
  emptyMsg: "Ei tietoja"
});

Ext.define("Ext.locale.fi.form.field.Base", {
  override: "Ext.form.field.Base",
  invalidText: "Tämän kentän arvo ei kelpaa"
});

Ext.define("Ext.locale.fi.form.field.Text", {
  override: "Ext.form.field.Text",
  minLengthText: "Tämän kentän minimipituus on {0}",
  maxLengthText: "Tämän kentän maksimipituus on {0}",
  blankText: "Tämä kenttä on pakollinen",
  regexText: "",
  emptyText: null
});

Ext.define("Ext.locale.fi.form.field.Number", {
  override: "Ext.form.field.Number",
  minText: "Tämän kentän pienin sallittu arvo on {0}",
  maxText: "Tämän kentän suurin sallittu arvo on {0}",
  nanText: "{0} ei ole numero"
});

Ext.define("Ext.locale.fi.form.field.Date", {
  override: "Ext.form.field.Date",
  disabledDaysText: "Ei käytössä",
  disabledDatesText: "Ei käytössä",
  minText: "Tämän kentän päivämäärän tulee olla {0} jälkeen",
  maxText: "Tämän kentän päivämäärän tulee olla ennen {0}",
  invalidText:
    "Päivämäärä {0} ei ole oikeassa muodossa - kirjoita päivämäärä muodossa {1}",
  format: "j.n.Y",
  altFormats: "j.n.|d.m.|mdy|mdY|d|Y-m-d|Y/m/d"
});

Ext.define(
  "Ext.locale.fi.form.field.ComboBox",
  {
    override: "Ext.form.field.ComboBox",
    valueNotFoundText: undefined
  },
  function () {
    Ext.apply(Ext.form.field.ComboBox.prototype.defaultListConfig, {
      loadingText: "Ladataan..."
    });
  }
);

Ext.define("Ext.locale.fi.form.field.VTypes", {
  override: "Ext.form.field.VTypes",
  emailText:
    'Syötä tähän kenttään sähköpostiosoite, esim. "etunimi.sukunimi@osoite.fi"',
  urlText: 'Syötä tähän kenttään URL-osoite, esim. "http:/' + '/www.osoite.fi"',
  alphaText: "Syötä tähän kenttään vain kirjaimia (a-z, A-Z) ja alaviivoja (_)",
  alphanumText:
    "Syötä tähän kenttään vain kirjaimia (a-z, A-Z), numeroita (0-9) ja alaviivoja (_)"
});

Ext.define(
  "Ext.locale.fi.form.field.HtmlEditor",
  {
    override: "Ext.form.field.HtmlEditor",
    createLinkText: "Anna linkin URL-osoite:"
  },
  function () {
    Ext.apply(Ext.form.field.HtmlEditor.prototype, {
      buttonTips: {
        bold: {
          title: "Lihavoi (Ctrl+B)",
          text: "Lihavoi valittu teksti.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        italic: {
          title: "Kursivoi (Ctrl+I)",
          text: "Kursivoi valittu teksti.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        underline: {
          title: "Alleviivaa (Ctrl+U)",
          text: "Alleviivaa valittu teksti.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        increasefontsize: {
          title: "Suurenna tekstiä",
          text: "Kasvata tekstin kirjasinkokoa.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        decreasefontsize: {
          title: "Pienennä tekstiä",
          text: "Pienennä tekstin kirjasinkokoa.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        backcolor: {
          title: "Tekstin korostusväri",
          text: "Vaihda valitun tekstin taustaväriä.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        forecolor: {
          title: "Tekstin väri",
          text: "Vaihda valitun tekstin väriä.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        justifyleft: {
          title: "Tasaa vasemmalle",
          text: "Tasaa teksti vasempaan reunaan.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        justifycenter: {
          title: "Keskitä",
          text: "Keskitä teksti.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        justifyright: {
          title: "Tasaa oikealle",
          text: "Tasaa teksti oikeaan reunaan.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        insertunorderedlist: {
          title: "Luettelo",
          text: "Luo luettelo.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        insertorderedlist: {
          title: "Numeroitu luettelo",
          text: "Luo numeroitu luettelo.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        createlink: {
          title: "Linkki",
          text: "Tee valitusta tekstistä hyperlinkki.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        sourceedit: {
          title: "Lähdekoodin muokkaus",
          text: "Vaihda lähdekoodin muokkausnäkymään.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        }
      }
    });
  }
);

Ext.define("Ext.locale.fi.form.Basic", {
  override: "Ext.form.Basic",
  waitTitle: "Odota..."
});

Ext.define("Ext.locale.fi.grid.header.Container", {
  override: "Ext.grid.header.Container",
  sortAscText: "Järjestä A-Ö",
  sortDescText: "Järjestä Ö-A",
  lockText: "Lukitse sarake",
  unlockText: "Vapauta sarakkeen lukitus",
  columnsText: "Sarakkeet"
});

Ext.define("Ext.locale.fi.grid.GroupingFeature", {
  override: "Ext.grid.feature.Grouping",
  emptyGroupText: "(ei mitään)",
  groupByText: "Ryhmittele tämän kentän mukaan",
  showGroupsText: "Näytä ryhmissä"
});

Ext.define("Ext.locale.fi.grid.PropertyColumnModel", {
  override: "Ext.grid.PropertyColumnModel",
  nameText: "Nimi",
  valueText: "Arvo",
  dateFormat: "j.m.Y"
});

Ext.define("Ext.locale.fi.window.MessageBox", {
  override: "Ext.window.MessageBox",
  buttonText: {
    ok: "OK",
    cancel: "Peruuta",
    yes: "Kyllä",
    no: "Ei"
  }
});

// This is needed until we can refactor all of the locales into individual files
Ext.define("Ext.locale.fi.Component", {
  override: "Ext.Component"
});
