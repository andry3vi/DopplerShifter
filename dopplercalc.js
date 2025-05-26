document.addEventListener('DOMContentLoaded', function() {
    getCookies();
}, false);

const c = 299792458 //s.o.l. m/s
const e = 1.60217662e-19 
const mu = 1.66053904e-27



//--------------------------------//
// create element list for autocomplete
//--------------------------------//

const list_element_sym = ["n","H","He","Li","Be","B","C","N","O","F","Ne","Na","Mg","Al","Si","P","S","Cl","Ar","K",
                    "Ca","Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr","Rb",
                    "Sr","Y","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te","I","Xe","Cs",
                    "Ba","La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu","Hf","Ta",
                    "W","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn","Fr","Ra","Ac","Th","Pa",
                    "U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr","Rf","Db","Sg","Bh","Hs","Mt",
                    "Ds","Rg"];
                    
var list_el = document.getElementById('Elements');
                    
list_element_sym.forEach(function(item){
    var option = document.createElement('option');
    option.value = item;
    list_el.appendChild(option);
});
//--------------------------------//
//--------------------------------//

//--------------------------------//
// cookie settings functions
//--------------------------------//
function setCookies(){
    document.querySelectorAll('[id^=_]').forEach(function(node) {
        setCookie(node.id,node.value,10);
    });

    var table = document.getElementById("isotab");
    var ids = table.rows.length-3;
    setCookie("isoNumbers",ids,10);
}
function getCookies(){
    var table = document.getElementById("isotab");
    var ids = table.rows.length-3;
    // console.log("row current -> "+ids);
    // console.log("row from cookie -> "+getCookie("isoNumbers"));
    if((getCookie("isoNumbers")-ids)>0){
        for (let index = 0; index < getCookie("isoNumbers")-ids; index++) {
            // console.log("adding row")
            addRow();
        }
    }
    if((getCookie("isoNumbers")-ids)<0){
        for (let index = 0; index < ids-getCookie("isoNumbers"); index++) {
            rmRow();
        }
    }
    document.querySelectorAll('[id^=_]').forEach(function(node) {
        node.value = getCookie(node.id);
    });
}
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}
//--------------------------------//
//--------------------------------//

//--------------------------------//
// Reference settings
//--------------------------------//
function setElementBySymbol(){
    document.getElementById("_Zref").value = list_element_sym.indexOf(document.getElementById("_Elref").value);
    setCookies();
}
function setElementByZ(){
    document.getElementById("_Elref").value = list_element_sym[document.getElementById("_Zref").value];
    setCookies();
}
function setElInfo(){

    dfd.readCSV("nuclides.csv") //assumes file is in CWD
        .then(df => {
            let sub_df = df.loc({
                rows: df["a"].eq(parseInt(document.getElementById("_Aref").value)).and(df["z"].eq(parseInt(document.getElementById("_Zref").value))),
                columns: ["atomic_mass","jp"]
            })
            // sub_df.print()
            document.getElementById("_Massuref").value = sub_df["atomic_mass"].values;
            document.getElementById("_Iref").value = sub_df["jp"].values;
            CalculateSP();
            setCookies();
        

    }).catch(err=>{
     console.log(err);
    })
}
//--------------------------------//
//--------------------------------//


//--------------------------------//
// Transition settings
//--------------------------------//
function UpdateFromLevel() {
    lower = document.getElementById('_Elow').value;
    upper = document.getElementById('_Eup').value;
    Wn = upper - lower;
    if (Wn>0) {
        document.getElementById('_Wn').value=Wn;
        UpdateFromWn();
    }
    setCookies();
    // console.log(Wn);
}
function UpdateFromFq() {
    document.getElementById('_Wn').value = document.getElementById('_Fq').value/(c*100);
    document.getElementById('_Wl').value = c*1000000000/document.getElementById('_Fq').value;
    CalculateSP();
    setCookies();
}
function UpdateFromWl() {
    document.getElementById('_Fq').value = c*1000000000/document.getElementById('_Wl').value;
    document.getElementById('_Wn').value = document.getElementById('_Fq').value/(c*100);
    CalculateSP();
    setCookies();
}
function UpdateFromWn() {
    document.getElementById('_Fq').value = document.getElementById('_Wn').value*c*100;
    document.getElementById('_Wl').value = c*1000000000/document.getElementById('_Fq').value;
    CalculateSP();
    setCookies();
}
//--------------------------------//
//--------------------------------//


function dopplerShift(fq,mass,voltage,collinear){
    let m = mass*mu;
    
    const beta = Math.sqrt(1 - (m**2 * c**4)/(e*voltage + m*c**2)**2);
    const factor = (1+beta)/Math.sqrt(1-beta**2);
    if (collinear == 1){
        return fq * factor;
    }
    else{
        return fq / factor;
    }
}

function voltageShift(lab_fq,rest_fq,mass){
    //"""Mass in amu, return voltage in V"""
    let m = mass*mu;
    const beta = (lab_fq**2 / rest_fq**2 - 1) / (lab_fq**2 / rest_fq**2 + 1);
    return m * c**2 / e * ( (lab_fq**2 + rest_fq**2) / 2 / rest_fq / lab_fq - 1 );
}

function CalculateSP() {

    try {
        document.getElementById('_SPFq').value = dopplerShift (document.getElementById('_Fq').value/document.getElementById('_Har').value,document.getElementById("_Massuref").value,document.getElementById("_Acc").value,document.getElementById("_Geom").value);
        document.getElementById('_SPWn').value = document.getElementById('_SPFq').value/(c*100);
        document.getElementById('_SPWl').value = c*1000000000/document.getElementById('_SPFq').value;
    } catch (error) {
        console.log(error)
    }
    
    updateIsotab();
    setCookies();
}

function addRow() {
    const table = document.getElementById("isotab");
    const lastRow = table.rows[table.rows.length - 1];
    const newRow = lastRow.cloneNode(true);

    const oldId = table.rows.length - 3;
    const id = oldId + 1;
    newRow.id = `isorow_${id}`;

    // Update input IDs in the new row
    Array.from(newRow.getElementsByTagName('input')).forEach(input => {
        const parts = input.id.split("_");
        if (parts.length > 2) {
            input.id = `_${parts[1]}_${id}`;
        }
    });

    $('#isotab').append(newRow);
    updateIsoListener();
}

function rmRow() {
    const table = document.getElementById("isotab");
    if (table.rows.length > 3) {
        table.deleteRow(table.rows.length - 1);
    }
    updateIsoListener();
}
function updateIsoListener(){

    document.querySelectorAll('[id^=_A_]').forEach(function(node) {
        node.removeEventListener("change",setIsoInfo);
        node.addEventListener("change",setIsoInfo);
    });
    document.querySelectorAll('[id^=_Z_]').forEach(function(node) {
        node.removeEventListener("change",setIsoInfo);
        node.removeEventListener("change",setIsoByZ);
        node.addEventListener("change",setIsoInfo);
        node.addEventListener("change",setIsoByZ);
    });    
    document.querySelectorAll('[id^=_El_]').forEach(function(node) {
        node.removeEventListener("change",setIsoInfo);
        node.removeEventListener("change",setIsoBySymbol);
        node.addEventListener("change",setIsoInfo);
        node.addEventListener("change",setIsoBySymbol);   
    });
    document.querySelectorAll('[id^=_Fqshift_]').forEach(function(node) {
        node.removeEventListener("change", updateIsotab);
        node.removeEventListener("change", plotSelectedHFS);
        node.addEventListener("change", updateIsotab);
        node.addEventListener("change", plotSelectedHFS);
    });
    document.querySelectorAll('#isotab input, #isotab select').forEach(function(node) {
        node.removeEventListener("change", plotSelectedHFS);
        node.addEventListener("change", plotSelectedHFS);
    });
}
function updateIsotab(){
    // document.getElementById('_LSPx2Wl').value = 2*10000000/document.getElementById('_LSPWn').value;
    var table = document.getElementById("isotab");
    var ids = table.rows.length-3;
    for (let index = 0; index < ids+1; index++) {
        // const FQshifted = dopplerShift(document.getElementById('Fq').value/document.getElementById('Har').value,document.getElementById("Massu_"+index).value,document.getElementById("Acc").value,document.getElementById("Geom").value);
        
        // document.getElementById("Fqshift_"+index).value = 1e-6*(document.getElementById('LSPWn').value*c*100-FQshifted);
        let lab_fq = document.getElementById('_LSPWn').value*c*100
        let rest_fq = (document.getElementById('_Fq').value/document.getElementById('_Har').value) +(1e6*document.getElementById("_Fqshift_"+index).value/document.getElementById('_Har').value)
        document.getElementById("_Vshift_"+index).value = document.getElementById('_Acc').value-voltageShift(lab_fq,rest_fq,document.getElementById("_Massu_"+index).value);
    }
    setCookies();

    // console.log(table.rows.length)

}
function setIsoBySymbol(evt){
    var id = evt.currentTarget.id.split("_")[2];
    document.getElementById("_Z_"+id).value = list_element_sym.indexOf(document.getElementById("_El_"+id).value);
    updateIsotab();
    // setCookies();
}
function setIsoByZ(evt){
    var id = evt.currentTarget.id.split("_")[2];
    document.getElementById("_El_"+id).value = list_element_sym[document.getElementById("_Z_"+id).value];
    updateIsotab();
    // setCookies();
}
function setIsoInfo(evt){
    var id = evt.currentTarget.id.split("_")[2];
    dfd.readCSV("nuclides.csv") //assumes file is in CWD
        .then(df => {
            let sub_df = df.loc({
                rows: df["a"].eq(parseInt(document.getElementById("_A_"+id).value)).and(df["z"].eq(parseInt(document.getElementById("_Z_"+id).value))),
                columns: ["atomic_mass","jp"]
            })
            // sub_df.print()
            document.getElementById("_Massu_"+id).value = sub_df["atomic_mass"].values;
            document.getElementById("_I_"+id).value = sub_df["jp"].values;
            updateIsotab();
            // CalculateSP();
            // setCookies();
        // 

    }).catch(err=>{
     console.log(err);
    })
}

document.getElementById("_Elow").addEventListener("change", UpdateFromLevel);
document.getElementById("_Eup").addEventListener("change", UpdateFromLevel);
document.getElementById("_Wn").addEventListener("change", UpdateFromWn);
document.getElementById("_Wl").addEventListener("change", UpdateFromWl);
document.getElementById("_Fq").addEventListener("change", UpdateFromFq);
document.getElementById("_Zref").addEventListener("change", setElementByZ);
document.getElementById("_Zref").addEventListener("change", setElInfo);
document.getElementById("_Aref").addEventListener("change", setElInfo);
document.getElementById("_Elref").addEventListener("change", setElInfo);
document.getElementById("_Elref").addEventListener("change", setElementBySymbol);
document.getElementById("_Massuref").addEventListener("change", CalculateSP);
document.getElementById("_Iref").addEventListener("change", setCookies);
document.getElementById("_Jlow").addEventListener("change", setCookies);
document.getElementById("_Jup").addEventListener("change", setCookies);
document.getElementById("_Geom").addEventListener("change", CalculateSP);
document.getElementById("_Har").addEventListener("change", CalculateSP);
document.getElementById("_Acc").addEventListener("change", CalculateSP);
document.getElementById("_LSPWn").addEventListener("change",updateIsotab);

updateIsoListener();  


function SaveConfiguration(){
    // object we want to save
    var conf = {};
    document.querySelectorAll('[id^=_]').forEach(function(node) {
        conf[node.id] = node.value;
    });

    var table = document.getElementById("isotab");
    var ids = table.rows.length-3;
    conf["isoNumbers"] = ids;

    // convert to json string
    var outJSON = JSON.stringify( conf );
    var data = new Blob([outJSON], {type: "json"});
    // var text = encodeURIComponent( data );
        var a = document.createElement("a"),
        url = URL.createObjectURL(data);
        a.href = url;
        a.download = "conf.txt";
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0);
    setCookies();
}

async function LoadConfiguration(){

    try {
        const file = document.getElementById("ConfFile").files[0];
        // console.log(file);
        const content = await file.text();
        data = JSON.parse( content);
    } catch (error) {
      window.alert("Select a configuration file first");
      console.error(error);

    }
        var table = document.getElementById("isotab");
        var ids = table.rows.length-3;
        if((data["isoNumbers"]-ids)>0){
            for (let index = 0; index < data["isoNumbers"]-ids; index++) {
                addRow();
            }
        }
        if((data["isoNumbers"]-ids)<0){
            for (let index = 0; index < ids-data["isoNumbers"]; index++) {
                rmRow();
            }
        }
        Object.keys(data).forEach(function(key) {
            console.log('Key : ' + key + ', Value : ' + data[key]);
            try {
                document.getElementById(key).value = data[key];
                
            } catch (error) {
                console.log(error);
            }
          })
        setCookies();
      
    

    // console.log(content);
}


function plotSelectedHFS() {
    const checked = document.querySelectorAll('#isotab tbody input.iso-select:checked');
    if (checked.length === 0) {
        Plotly.purge('hfs_plotly');
        return;
    }
    let traces = [];
    checked.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const idx = row.dataset.index;

        // Helper to parse spin and J values (handles fractions and negatives)
        function parseAbsNumber(val) {
            if (!val) return 0;
            const match = String(val).match(/-?[\d.\/]+/);
            if (!match) return 0;
            let numStr = match[0];
            if (numStr.includes('/')) {
                const [n, d] = numStr.split('/').map(Number);
                return Math.abs(n / d);
            }
            return Math.abs(parseFloat(numStr));
        }

        // Robustly get values from the row
        const Iinput = row.querySelector('input[id^="_I_"]');
        const I = parseAbsNumber(Iinput ? Iinput.value : 0);

        const AlowInput = row.querySelector('input[id^="_Alow_"]');
        const BlowInput = row.querySelector('input[id^="_Blow_"]');
        const AupInput  = row.querySelector('input[id^="_Aup_"]');
        const BupInput  = row.querySelector('input[id^="_Bup_"]');
        const Alow = AlowInput ? parseFloat(AlowInput.value) || 0 : 0;
        const Blow = BlowInput ? parseFloat(BlowInput.value) || 0 : 0;
        const Aup  = AupInput  ? parseFloat(AupInput.value)  || 0 : 0;
        const Bup  = BupInput  ? parseFloat(BupInput.value)  || 0 : 0;

        const Jlow = parseAbsNumber(document.getElementById('_Jlow')?.value);
        const Jup  = parseAbsNumber(document.getElementById('_Jup')?.value);

        // For legend
        const Ainput = row.querySelector('input[id^="_A_"]');
        const Elinput = row.querySelector('input[id^="_El_"]');
        const isotopeLabel = `${Ainput ? Ainput.value : ''} ${Elinput ? Elinput.value : ''}`.trim();

        function allowedF(I, J) {
            if (I === 0 || J === 0) return [Math.abs(I - J)];
            const Fmin = Math.abs(I - J);
            const Fmax = I + J;
            let F = [];
            for (let f = Fmin; f <= Fmax; f++) F.push(f);
            return F;
        }
        function Ehfs(A, B, I, J, F) {
            const K = F*(F+1) - I*(I+1) - J*(J+1);
            let E = 0.5 * A * K;
            if (I > 0.5 && J > 0.5) {
                E += B * ( ( (3/4)*K*(K+1) - I*(I+1)*J*(J+1) ) / (2*I*(2*I-1)*J*(2*J-1)) );
            }
            return E;
        }
        const Flow = allowedF(I, Jlow);
        const Fup = allowedF(I, Jup);
        const E_low = Flow.map(F => Ehfs(Alow, Blow, I, Jlow, F));
        const E_up = Fup.map(F => Ehfs(Aup, Bup, I, Jup, F));
        let freq = [], intensity = [], labels = [];
        const FqshiftInput = row.querySelector('input[id^="_Fqshift_"]');
        const Fqshift = FqshiftInput ? parseFloat(FqshiftInput.value) || 0 : 0;

        for (let i = 0; i < Fup.length; i++) {
            for (let j = 0; j < Flow.length; j++) {
                const F1 = Fup[i], F2 = Flow[j];
                if (Math.abs(F1 - F2) > 1) continue;
                if (F1 === 0 && F2 === 0) continue;
                // Add isotope shift to the frequency
                const nu = (E_up[i] - E_low[j]) + Fqshift;
                const inten = 2 * F1 + 1;
                freq.push(nu);
                intensity.push(inten);
                labels.push(`F'=${F1} → F''=${F2}`);
            }
        }
        const maxInt = Math.max(...intensity, 1);
        intensity = intensity.map(i => i / maxInt);
        const FWHM = 50;
        const sigma = FWHM / (2 * Math.sqrt(2 * Math.log(2)));
        const minFreq = Math.min(...freq) - 2 * FWHM;
        const maxFreq = Math.max(...freq) + 2 * FWHM;
        const Npoints = 1000;
        const x = [], y = [];
        for (let i = 0; i < Npoints; i++) {
            x[i] = minFreq + (maxFreq - minFreq) * i / (Npoints - 1);
            y[i] = 0;
        }
        for (let k = 0; k < freq.length; k++) {
            for (let i = 0; i < Npoints; i++) {
                y[i] += intensity[k] * Math.exp(-0.5 * ((x[i] - freq[k]) / sigma) ** 2);
            }
        }
        const ymax = Math.max(...y, 1);
        for (let i = 0; i < y.length; i++) y[i] /= ymax;
        traces.push({
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            name: isotopeLabel,
        });
    });
    const layout = {
        title: 'Hyperfine Spectrum (Gaussian profile, FWHM = 50 MHz)',
        xaxis: {title: 'Frequency [MHz]'},
        yaxis: {title: 'Relative Intensity', range: [0, 1.1]},
        showlegend: true
    };
    Plotly.newPlot('hfs_plotly', traces, layout, {responsive: true});
}