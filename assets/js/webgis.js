// =========================================================================
// FILE: assets/js/webgis.js
// Otak Front-End untuk Peta Bansos (Melayani Admin Lokal & Super Admin)
// =========================================================================

// Variabel Global Leaflet
let tempLat, tempLng;
const map = L.map('map', { zoomControl: false }).setView([-0.0263, 109.3425], 13);
L.control.zoom({ position: 'topright' }).addTo(map);
const baseOsm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

// Inisialisasi Ikon
const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const violetIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const daruratIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], className: 'marker-darurat' });

const layerIbadah = L.layerGroup().addTo(map);
const layerPenduduk = L.layerGroup().addTo(map);
let searchableLayers = [];

// --- UTILITAS UMUM ---
window.konfirmasiLogout = function(urlLogout) {
    if(confirm("Apakah Anda yakin ingin keluar dari sistem?")) { window.location.href = urlLogout; }
}
window.tutupModal = function(modalId) { document.getElementById(modalId).style.display = "none"; }
window.onclick = function(event) { if (event.target.classList.contains('modal')) { event.target.style.display = "none"; } }
window.toggleOpsiLanjutan = function(id) {
    let el = document.getElementById('opsi-' + id);
    el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}
window.cariLokasiSaya = function() { map.locate({setView: true, maxZoom: 16}); }
map.on('locationfound', function(e) { L.marker(e.latlng).addTo(map).bindPopup("📍 Anda di sini.").openPopup(); });

async function getAlamatOtomatis(lat, lng) {
    try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const d = await r.json();
        if(d && d.address) return [d.address.road, d.address.village||d.address.suburb, d.address.city_district].filter(Boolean).join(", ");
    } catch (e) {} return "";
}

window.cariData = function() {
    const kw = document.getElementById('searchInput').value.toLowerCase().trim(); if (!kw) return;
    let f = false;
    for (let i of searchableLayers) {
        if (i.nama && i.nama.toLowerCase().includes(kw)) { map.flyTo(i.layer.getLatLng(), 18); i.layer.openPopup(); f = true; break; }
    }
    if (!f) alert("Data tidak ditemukan!");
}
window.handleEnter = function(e) { if (e.key === 'Enter') cariData(); }


// --- FUNGSI RENDER PETA (DIPANGGIL DARI PHP HTML) ---
function initWebGIS() {
    // Kalkulasi Jarak & Radius Warga ke Institusi terdekat
    DATA_PENDUDUK.forEach(p => {
        let latlngPenduduk = L.latLng(p.latitude, p.longitude);
        let minDist = Infinity; let closestIbadah = null;

        DATA_IBADAH.forEach(ib => {
            let dist = latlngPenduduk.distanceTo(L.latLng(ib.latitude, ib.longitude));
            if (dist < minDist) { minDist = dist; closestIbadah = ib; }
        });

        p.closestIbadah = closestIbadah;
        p.minDist = minDist;
        p.isInside = (closestIbadah && minDist <= closestIbadah.radius);

        if (p.isInside && closestIbadah) {
            let ibadahIndex = DATA_IBADAH.findIndex(ib => ib.id === closestIbadah.id);
            if(ibadahIndex !== -1) DATA_IBADAH[ibadahIndex].warga_count++;
        }
    });

    // Render Tempat Ibadah
    DATA_IBADAH.forEach(ib => {
        const marker = L.marker([ib.latitude, ib.longitude], { icon: violetIcon });
        
        let ibadahControls = IS_SUPER_ADMIN ? `
            <div class="button-group">
                <button class="btn-edit" onclick="editIbadah(${ib.id}, '${ib.nama}', '${ib.jenis}', ${ib.radius}, '${ib.alamat}', ${ib.latitude}, ${ib.longitude})">Edit Profil</button>
                <button class="btn-delete" onclick="hapusIbadah(${ib.id})">Hapus</button>
            </div>
        ` : '';

        let htmlPopup = `
            <div class="popup-content">
                <div class="popup-title">🕌 ${ib.nama}</div>
                <div style="font-size: 0.9rem;">Tipe: ${ib.jenis || 'Institusi'} <br> Radius: <b>${ib.radius} Meter</b></div>
                <div class="stat-box">
                    👥 Warga dalam jangkauan: <span>${ib.warga_count} KK</span><br>
                    📦 Total Penyaluran: <span>${ib.total_log || 0} Kali</span>
                </div>
                ${ibadahControls}
            </div>
        `;
        marker.bindPopup(htmlPopup);
        marker.addTo(layerIbadah);
        L.circle([ib.latitude, ib.longitude], { radius: ib.radius, color: 'violet', fillOpacity: 0.1 }).addTo(layerIbadah);
        searchableLayers.push({ nama: ib.nama, layer: marker, tipe: 'titik' });
    });

    // Render Warga Miskin
    DATA_PENDUDUK.forEach(p => {
        let isDarurat = p.is_darurat > 0;
        let idMusibahAktif = p.id_musibah_aktif ? p.id_musibah_aktif : 'null'; 
        let iconPenduduk = isDarurat ? daruratIcon : (p.isInside ? greenIcon : redIcon);
        
        let statusBadge = ""; let statusLabel = "";
        let statusKemiskinan = p.status_kemiskinan || "Data Belum Lengkap";
        
        if (statusKemiskinan === "Data Belum Lengkap" || (!p.skor_aset && !p.pengeluaran)) {
            statusBadge = "bg-gray"; statusLabel = "Data Belum Lengkap";
        } else if (statusKemiskinan === "Sangat Miskin") {
            statusBadge = "bg-red"; statusLabel = "SANGAT MISKIN (P1)";
        } else if (statusKemiskinan === "Miskin") {
            statusBadge = "bg-orange"; statusLabel = "MISKIN (P2)";
        } else {
            statusBadge = "bg-yellow"; statusLabel = "RENTAN MISKIN";
        }

        let radiusText = '';
        let actionButtons = '';
        let isOwnedByAdmin = IS_SUPER_ADMIN ? true : (p.closestIbadah && p.closestIbadah.id == ADMIN_ID_IBADAH && p.isInside);
        
        let bannerDarurat = isDarurat ? `
            <div style="background-color: #c0392b; color: white; padding: 6px; text-align: center; border-radius: 4px; font-weight: bold; margin-bottom: 8px; animation: blink-animation 1s infinite;">
                🚨 STATUS DARURAT MUSIBAH
            </div>
        ` : '';

        if (p.isInside || IS_SUPER_ADMIN) {
            radiusText = p.isInside ? `🟢 Masuk area <b>${p.closestIbadah.nama}</b>` : `🔴 Di luar jangkauan (Bypass Super Admin)`;
            
            if (isOwnedByAdmin) {
                let btnBantuanHtml = (!IS_SUPER_ADMIN) ? `<button class="btn-action" onclick="bukaFormBantuan(${p.id}, '${statusLabel}', ${p.latitude}, ${p.longitude}, ${idMusibahAktif})">📦 Catat Penyaluran Bantuan</button>` : '';

                actionButtons = `
                    ${btnBantuanHtml}
                    <button class="btn-danger" onclick="bukaFormMusibah(${p.id}, ${p.latitude}, ${p.longitude})">🚨 Lapor Musibah Darurat</button>
                    <button class="btn-info" onclick="bukaModalKeluarga(${p.id}, '${p.nama_kk}')">👨‍👩‍👧‍👦 Data Keluarga & Pelatihan</button>
                    
                    <button class="btn-secondary" onclick="toggleOpsiLanjutan(${p.id})">⚙️ Opsi Lanjutan ▼</button>
                    
                    <div id="opsi-${p.id}" style="display:none; margin-top:10px; border-top:1px dashed #ccc; padding-top:5px;">
                        <button class="btn-history" onclick="lihatRiwayat(${p.id}, '${p.nama_kk}', ${p.latitude}, ${p.longitude})">📜 Lihat Riwayat Bantuan</button>
                        <button class="btn-training" onclick="lihatLogPelatihan(${p.id}, '${p.nama_kk}', ${p.latitude}, ${p.longitude})">🎓 Lihat Log Pelatihan</button>
                        <div class="button-group">
                            <button class="btn-edit" onclick="editPenduduk(${p.id}, '${p.nama_kk}', '${p.alamat}', '${p.agama}', ${p.tanggungan}, ${p.pengeluaran}, ${p.lantai||0}, ${p.dinding||0}, ${p.sanitasi||0}, ${p.listrik||0}, ${p.air||0}, ${p.latitude}, ${p.longitude})">Edit Data Induk</button>
                            <button class="btn-delete" onclick="hapusPenduduk(${p.id})">Hapus Rumah</button>
                        </div>
                    </div>
                `;
            } else {
                actionButtons = `<div style="margin-top:10px; padding:8px; background:#eee; color:#7f8c8d; font-size:0.85rem; text-align:center; border-radius:4px;">Wewenang: ${p.closestIbadah.nama}</div>`;
            }
        } else {
            radiusText = `🔴 Di Luar Jangkauan Bantuan`;
            actionButtons = `<div style="margin-top:10px; padding:8px; background:#f9ebea; color:#c0392b; font-size:0.85rem; text-align:center; border-radius:4px;">Tidak masuk radius wewenang tempat ibadah manapun.</div>`;
        }

        let marker = L.marker([p.latitude, p.longitude], { icon: iconPenduduk }).bindPopup(`
            <div class="popup-content">
                ${bannerDarurat}
                <div class="popup-title">🏠 Keluarga ${p.nama_kk}</div>
                ${p.alamat || 'Alamat tak diketahui'}<br>
                Tanggungan: ${p.tanggungan || '?'} Jiwa<br>
                <div style="margin-top: 5px;"><span class="badge ${statusBadge}">${statusLabel}</span></div>
                <hr style="margin: 8px 0; border: 0.5px solid #ccc;">
                <small>${radiusText}</small>
                <div style="margin-top: 8px;">${actionButtons}</div>
            </div>
        `);
        marker.addTo(layerPenduduk);
        searchableLayers.push({ nama: p.nama_kk, layer: marker, tipe: 'titik' });
    });

    // Menampilkan Layer
    loadBasemap(layerPenduduk, layerIbadah);
}

// --- FUNGSI LOAD KECAMATAN JSON ---
async function loadBasemap(layerPenduduk, layerIbadah) {
    const adminGrp = L.layerGroup().addTo(map);
    try {
        // PERHATIAN: Sesuaikan URL json ini jika Anda memindahkannya ke folder assets
        const dataAdmin = await (await fetch('assets/data/Admin_Kecamatan.json')).json();
        L.geoJSON(dataAdmin, {
            style: function (f) {
                const n = (f.properties.Ket || "").toUpperCase();
                let c = "#ccc";
                if(n.includes("BARAT")) c="#e41a1c"; else if(n.includes("KOTA")) c="#377eb8"; else if(n.includes("SELATAN")) c="#4daf4a";
                else if(n.includes("TENGGARA")) c="#984ea3"; else if(n.includes("TIMUR")) c="#ff7f00"; else if(n.includes("UTARA")) c="#f1c40f";
                return { color: "black", weight: 2, fillOpacity: 0.2, fillColor: c };
            },
            onEachFeature: function (f, layer) {
                const p = new Intl.NumberFormat('id-ID').format(f.properties.penduduk || 0);
                layer.bindPopup(`<div style="text-align: center;"><b>Kecamatan ${f.properties.Ket || '?'}</b><hr>Penduduk: <b>${p} Jiwa</b></div>`);
            }
        }).addTo(adminGrp);
    } catch (e) { console.error("Gagal load geojson kecamatan"); }
    
    const lc = L.control.layers(null, { "Batas Kecamatan": adminGrp, "Lokasi Warga": layerPenduduk, "Tempat Ibadah (Ungu)": layerIbadah }, { collapsed: false }).addTo(map);
    document.getElementById('layerControlWrapper').appendChild(lc.getContainer());
}

// --- DRAW CONTROL ---
const drawControl = new L.Control.Draw({ draw: { polyline: false, polygon: false, circle: false, rectangle: false, circlemarker: false, marker: { icon: redIcon } } }).addTo(map);
document.getElementById('drawControlWrapper').appendChild(drawControl.getContainer());

map.on(L.Draw.Event.CREATED, async function (e) {
    const layer = e.layer;
    tempLat = layer.getLatLng().lat; tempLng = layer.getLatLng().lng;
    let latlngNew = L.latLng(tempLat, tempLng);

    if (!IS_SUPER_ADMIN) {
        let ibadahAdmin = DATA_IBADAH.find(ib => ib.id == ADMIN_ID_IBADAH);
        if(ibadahAdmin && latlngNew.distanceTo(L.latLng(ibadahAdmin.latitude, ibadahAdmin.longitude)) > ibadahAdmin.radius) {
            alert("Titik ini berada di LUAR radius tempat ibadah Anda. Anda tidak berhak menambahkan warga di area ini.");
            return; 
        }
    }

    layer.bindPopup("<i>Menyiapkan form...</i>").addTo(map).openPopup();
    const alamatAuto = await getAlamatOtomatis(tempLat, tempLng);
    
    if (IS_SUPER_ADMIN) {
        let modePilih = document.getElementById('modeTambah').value;
        if(modePilih === 'warga') tampilkanFormPenduduk(layer, 0, '', alamatAuto, 'Islam', 0, '', 0, 0, 0, 0, 0, 'tambah');
        else tampilkanFormIbadah(layer, 0, '', 'Masjid', 500, alamatAuto, 'tambah');
    } else {
        tampilkanFormPenduduk(layer, 0, '', alamatAuto, 'Islam', 0, '', 0, 0, 0, 0, 0, 'tambah');
    }
});

// --- FUNGSI CRUD WARGA ---
function tampilkanFormPenduduk(layerOrId, id, nama, alamat, agama, tanggungan, pengeluaran, lantai, dinding, sanitasi, listrik, air, mode) {
    tanggungan = tanggungan || 0; pengeluaran = pengeluaran || '';
    const formContent = `
    <div class="popup-content">
        <div class="popup-title">${mode === 'tambah' ? 'Tambah Data Induk' : 'Edit Data Induk'} Warga</div>
        <label>Nama Kepala Keluarga (KK)</label><input type="text" id="p_nama" value="${nama}">
        <label>Alamat Lengkap</label><input type="text" id="p_alamat" value="${alamat}">
        <label>Agama</label>
        <select id="p_agama">
            <option value="Islam" ${agama=='Islam'?'selected':''}>Islam</option><option value="Kristen Katolik" ${agama=='Kristen Katolik'?'selected':''}>Kristen Katolik</option><option value="Kristen Protestan" ${agama=='Kristen Protestan'?'selected':''}>Kristen Protestan</option>
            <option value="Hindu" ${agama=='Hindu'?'selected':''}>Hindu</option><option value="Buddha" ${agama=='Buddha'?'selected':''}>Buddha</option><option value="Konghucu" ${agama=='Konghucu'?'selected':''}>Konghucu</option>
        </select>
        <div style="display:flex; gap: 5px;">
            <div style="flex:1;"><label>Tanggungan</label><input type="number" id="p_tanggungan" value="${tanggungan}" readonly title="Otomatis dihitung"></div>
            <div style="flex:2;"><label>Pengeluaran (Rp)</label><input type="number" id="p_pengeluaran" value="${pengeluaran}"></div>
        </div>
        <hr style="margin: 5px 0;"><label style="color:#d35400;">Observasi Fisik Rumah (PMT)</label>
        <label>Lantai</label><select id="p_lantai"><option value="1" ${lantai==1?'selected':''}>Rendah</option><option value="0" ${lantai==0?'selected':''}>Bagus</option></select>
        <label>Dinding</label><select id="p_dinding"><option value="1" ${dinding==1?'selected':''}>Bambu/Rumbia</option><option value="0" ${dinding==0?'selected':''}>Tembok Bata</option></select>
        <label>Sanitasi</label><select id="p_sanitasi"><option value="1" ${sanitasi==1?'selected':''}>MCK Umum</option><option value="0" ${sanitasi==0?'selected':''}>Milik Sendiri</option></select>
        <label>Listrik</label><select id="p_listrik"><option value="1" ${listrik==1?'selected':''}>Numpang</option><option value="0" ${listrik==0?'selected':''}>Meteran Sendiri</option></select>
        <label>Air</label><select id="p_air"><option value="1" ${air==1?'selected':''}>Tak Terlindung</option><option value="0" ${air==0?'selected':''}>PDAM</option></select>
        <button class="btn-save" onclick="simpanPenduduk(${id}, '${mode}')">Simpan Profil Rumah</button>
    </div>`;
    if (mode === 'tambah') layerOrId.setPopupContent(formContent); else L.popup().setLatLng([tempLat, tempLng]).setContent(formContent).openOn(map);
}

window.editPenduduk = function(id, nama, alamat, agama, tanggungan, pengeluaran, lantai, dinding, sanitasi, listrik, air, lat, lng) {
    tempLat = lat; tempLng = lng; map.closePopup(); tampilkanFormPenduduk(null, id, nama, alamat, agama, tanggungan, pengeluaran, lantai, dinding, sanitasi, listrik, air, 'edit');
}

window.simpanPenduduk = async function(id, mode) {
    let valLantai = parseInt(document.getElementById('p_lantai').value); let valDinding = parseInt(document.getElementById('p_dinding').value);
    let valSanitasi = parseInt(document.getElementById('p_sanitasi').value); let valListrik = parseInt(document.getElementById('p_listrik').value);
    let valAir = parseInt(document.getElementById('p_air').value);
    let skorAset = valLantai + valDinding + valSanitasi + valListrik + valAir;
    let valPengeluaran = parseFloat(document.getElementById('p_pengeluaran').value) || 0; let valTanggungan = parseInt(document.getElementById('p_tanggungan').value) || 1;
    
    let pengeluaranKapita = valPengeluaran / (valTanggungan > 0 ? valTanggungan : 1);
    let miskinMoneter = pengeluaranKapita < GARIS_KEMISKINAN_KALBAR;
    let statusKemiskinan = (valPengeluaran > 0) ? (miskinMoneter && skorAset >= 3 ? "Sangat Miskin" : (miskinMoneter ? "Miskin" : "Rentan Miskin")) : "Data Belum Lengkap";

    const fd = new FormData(); if (mode === 'edit') fd.append('id', id);
    fd.append('latitude', tempLat); fd.append('longitude', tempLng); fd.append('nama_kk', document.getElementById('p_nama').value); fd.append('alamat', document.getElementById('p_alamat').value);
    fd.append('agama', document.getElementById('p_agama').value); fd.append('tanggungan', valTanggungan); fd.append('pengeluaran', valPengeluaran); fd.append('skor_aset', skorAset);
    fd.append('lantai', valLantai); fd.append('dinding', valDinding); fd.append('sanitasi', valSanitasi); fd.append('listrik', valListrik); fd.append('air', valAir); fd.append('status_kemiskinan', statusKemiskinan);

    const endpoint = mode === 'tambah' ? 'api/penduduk/tambah_penduduk.php' : 'api/penduduk/update_penduduk.php';
    const response = await fetch(endpoint, { method: 'POST', body: fd });
    if ((await response.json()).status === 'success') location.reload(); else alert("Gagal menyimpan data!");
}

window.hapusPenduduk = async function(id) { if (confirm("Hapus rumah dan seluruh keluarga ini?")) { await fetch(`api/penduduk/hapus_penduduk.php?id=${id}`); location.reload(); } }

// --- FUNGSI CRUD KELUARGA & PELATIHAN ---
window.bukaModalKeluarga = async function(id_penduduk, nama_kk) {
    map.closePopup();
    document.getElementById('modalTitle').innerText = "👨‍👩‍👧‍👦 Manajemen Anggota & Pelatihan: Keluarga " + nama_kk;
    document.getElementById('keluargaModal').style.display = "block";
    
    let opsiPelatihanHtml = '';
    try {
        const resPelatihan = await fetch('api/transaksi/get_master_pelatihan.php');
        const dataPelatihan = await resPelatihan.json();
        dataPelatihan.forEach(pel => { opsiPelatihanHtml += `<option value="${pel.id}">${pel.nama_pelatihan} (Oleh: ${pel.penyelenggara})</option>`; });
    } catch(e) {}

    document.getElementById('modalBody').innerHTML = `<p style="text-align:center;">Memuat data anggota...</p>`;
    
    const response = await fetch(`api/anggota/get_anggota_keluarga.php?id_penduduk=${id_penduduk}`);
    const dataAnggota = await response.json();

    let tableRows = '';
    if(dataAnggota.length > 0) {
        dataAnggota.forEach(ang => {
            let aksiHtml = `
                <div class="button-group" style="margin-top:0;">
                    <button class="btn-edit" style="width:48%; padding:4px; font-size:0.8rem; margin:0;" onclick="siapkanEditAnggota(${ang.id}, '${ang.nik}', '${ang.nama_lengkap}', '${ang.tanggal_lahir}', '${ang.pendidikan_terakhir}', '${ang.pekerjaan}')">Edit</button>
                    <button class="btn-delete" style="width:48%; padding:4px; font-size:0.8rem; margin:0;" onclick="hapusAnggota(${ang.id}, ${id_penduduk}, '${nama_kk}')">Hapus</button>
                </div>`;
            
            if(ang.rekomendasi_pelatihan) {
                aksiHtml += `
                    <div style="margin-top:5px; background:#e8f8f5; padding:5px; border-radius:4px; border: 1px solid #27ae60;">
                        <span style="font-size:0.8rem; color:#27ae60; font-weight:bold;">✨ Rekomendasi Pelatihan</span><br>
                        <select id="sel_pelatihan_${ang.id}" style="font-size:0.8rem; width:100%; margin-bottom:5px;">
                            ${opsiPelatihanHtml ? opsiPelatihanHtml : '<option value="">Tidak ada pelatihan aktif</option>'}
                        </select>
                        <button class="btn-training" style="padding:4px; font-size:0.8rem; margin:0;" onclick="daftarkanPelatihan(${ang.id}, ${id_penduduk}, '${nama_kk}')">Daftarkan</button>
                    </div>`;
            } else { aksiHtml += `<div style="margin-top:5px; font-size:0.75rem; color:#7f8c8d;">❌ Tidak Memenuhi Syarat Pelatihan</div>`; }

            tableRows += `<tr><td>${ang.nik}</td><td><b>${ang.nama_lengkap}</b><br><small>${ang.umur} Tahun</small></td><td>${ang.pendidikan_terakhir}</td><td>${ang.pekerjaan}</td><td style="width: 200px;">${aksiHtml}</td></tr>`;
        });
    } else { tableRows = `<tr><td colspan="5" style="text-align:center; padding: 15px;">Belum ada anggota keluarga ditambahkan.</td></tr>`; }

    document.getElementById('modalBody').innerHTML = `
        <div style="max-height: 40vh; overflow-y: auto; margin-bottom: 20px;">
            <table class="history-table" style="width: 100%;">
                <thead><tr><th>NIK</th><th>Nama & Umur</th><th>Pendidikan</th><th>Pekerjaan</th><th style="width: 200px;">Aksi</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
        <div id="formContainerAnggota" style="background-color: #f8f9fa; border: 1px solid #dcdde1; padding: 15px; border-radius: 6px;">
            <h4 id="formAnggotaTitle" style="margin-top:0; color:#34495e;">+ Tambah Anggota Keluarga Baru</h4>
            <input type="hidden" id="ak_id_edit" value="">
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <div style="flex: 1 1 30%;"><label>NIK</label><input type="text" id="ak_nik" maxlength="16"></div>
                <div style="flex: 1 1 30%;"><label>Nama Lengkap</label><input type="text" id="ak_nama"></div>
                <div style="flex: 1 1 30%;"><label>Tanggal Lahir</label><input type="date" id="ak_tgl"></div>
                <div style="flex: 1 1 30%;"><label>Pendidikan Terakhir</label><select id="ak_pendidikan"><option value="Tidak Sekolah">Tidak Sekolah</option><option value="SD Sederajat">SD Sederajat</option><option value="SMP Sederajat">SMP Sederajat</option><option value="SMA Sederajat">SMA Sederajat</option><option value="Diploma">Diploma</option><option value="Sarjana">Sarjana</option></select></div>
                <div style="flex: 1 1 30%;"><label>Pekerjaan Saat Ini</label><input type="text" id="ak_pekerjaan" placeholder="Cth: Tidak Bekerja / Menganggur"></div>
                <div style="flex: 1 1 100%; display:flex; align-items:flex-end; gap: 5px;">
                    <button id="btnSimpanAnggota" class="btn-info" style="margin:0; width:auto; padding: 10px 20px;" onclick="simpanAnggota(${id_penduduk}, '${nama_kk}')">Simpan Anggota</button>
                    <button id="btnBatalEdit" class="btn-secondary" style="margin:0; width:auto; padding: 10px 20px; display:none;" onclick="bukaModalKeluarga(${id_penduduk}, '${nama_kk}')">Batal Edit</button>
                </div>
            </div>
        </div>`;
}

window.siapkanEditAnggota = function(id, nik, nama, tgl, pendidikan, pekerjaan) {
    document.getElementById('ak_id_edit').value = id; document.getElementById('ak_nik').value = nik; document.getElementById('ak_nama').value = nama; document.getElementById('ak_tgl').value = tgl; document.getElementById('ak_pendidikan').value = pendidikan; document.getElementById('ak_pekerjaan').value = pekerjaan;
    document.getElementById('formAnggotaTitle').innerText = "✏️ Edit Data Anggota Keluarga"; document.getElementById('formContainerAnggota').style.backgroundColor = "#fef9e7"; document.getElementById('formContainerAnggota').style.borderColor = "#f1c40f";
    let btnSimpan = document.getElementById('btnSimpanAnggota'); btnSimpan.innerText = "Update Data Anggota"; btnSimpan.style.backgroundColor = "#f39c12"; document.getElementById('btnBatalEdit').style.display = "block";
}

window.simpanAnggota = async function(id_penduduk, nama_kk) {
    let id_edit = document.getElementById('ak_id_edit').value;
    const fd = new FormData(); if(id_edit) fd.append('id_anggota', id_edit);
    fd.append('id_penduduk', id_penduduk); fd.append('nik', document.getElementById('ak_nik').value); fd.append('nama_lengkap', document.getElementById('ak_nama').value); fd.append('tanggal_lahir', document.getElementById('ak_tgl').value); fd.append('pendidikan_terakhir', document.getElementById('ak_pendidikan').value); fd.append('pekerjaan', document.getElementById('ak_pekerjaan').value);

    if(!fd.get('nik') || !fd.get('nama_lengkap') || !fd.get('tanggal_lahir') || !fd.get('pekerjaan')) { alert("Lengkapi semua data!"); return; }
    const r = await fetch(id_edit ? 'api/anggota/update_anggota_keluarga.php' : 'api/anggota/tambah_anggota_keluarga.php', { method: 'POST', body: fd });
    if((await r.json()).status === 'success') { alert(id_edit ? "Berhasil diperbarui!" : "Berhasil ditambah!"); bukaModalKeluarga(id_penduduk, nama_kk); } else { alert("Gagal menyimpan."); }
}

window.hapusAnggota = async function(id_anggota, id_penduduk, nama_kk) {
    if(confirm("Yakin ingin menghapus anggota ini?")) {
        const r = await fetch(`api/anggota/hapus_anggota_keluarga.php?id=${id_anggota}`);
        if((await r.json()).status === 'success') bukaModalKeluarga(id_penduduk, nama_kk);
    }
}

window.daftarkanPelatihan = async function(id_anggota, id_penduduk, nama_kk) {
    let id_pel = document.getElementById('sel_pelatihan_' + id_anggota).value; if(!id_pel) return;
    if(confirm("Daftarkan anggota ini ke pelatihan?")) {
        const fd = new FormData(); fd.append('id_anggota', id_anggota); fd.append('id_pelatihan', id_pel);
        const r = await fetch('api/transaksi/tambah_log_pelatihan.php', { method: 'POST', body: fd });
        if((await r.json()).status === 'success') alert("Berhasil didaftarkan!"); else alert("Gagal didaftarkan");
    }
}

// --- FUNGSI BANTUAN & MUSIBAH ---
window.bukaFormMusibah = function(id_penduduk, lat, lng) {
    map.closePopup();
    L.popup().setLatLng([lat, lng]).setContent(`
    <div class="popup-content"><div class="popup-title" style="color:#c0392b;">🚨 Lapor Musibah Darurat</div>
        <label>Jenis Musibah</label><select id="m_jenis"><option value="Kebakaran">Kebakaran</option><option value="Sakit Keras">Sakit Keras</option><option value="Kematian">Kematian</option><option value="Kecelakaan">Kecelakaan</option><option value="Bencana Alam">Bencana Alam</option><option value="Lainnya">Lainnya</option></select>
        <label>Deskripsi Kejadian</label><textarea id="m_deskripsi" rows="3" style="width:100%; border:1px solid #ccc; border-radius:4px;"></textarea>
        <button class="btn-danger" style="margin-top:10px;" onclick="simpanLaporanMusibah(${id_penduduk})">Simpan Laporan Darurat</button>
    </div>`).openOn(map);
}

window.simpanLaporanMusibah = async function(id_penduduk) {
    let deskripsi = document.getElementById('m_deskripsi').value; if(!deskripsi.trim()) { alert("Isi deskripsi!"); return; }
    const fd = new FormData(); fd.append('id_penduduk', id_penduduk); fd.append('id_ibadah', ADMIN_ID_IBADAH); fd.append('jenis_musibah', document.getElementById('m_jenis').value); fd.append('deskripsi', deskripsi);
    const res = await (await fetch('api/transaksi/tambah_musibah.php', { method: 'POST', body: fd })).json();
    if(res.status === 'success') { alert("Berhasil dicatat!"); location.reload(); } else { alert("Gagal."); }
}

window.bukaFormBantuan = function(id_penduduk, status, lat, lng, id_musibah = null) {
    map.closePopup();
    let beras = 0, minyak = 0, gula = 0, telur = 0, susu = 0, uang = 0;
    if (status.includes("SANGAT MISKIN")) { beras = 10; minyak = 2; gula = 2; telur = 2; susu = 3; uang = 300000; } 
    else if (status.includes("MISKIN (P2)")) { beras = 5; minyak = 2; gula = 1; telur = 1; susu = 2; uang = 150000; } 
    else if (status.includes("RENTAN MISKIN")) { beras = 5; minyak = 1; gula = 1; telur = 0; susu = 1; uang = 0; }

    L.popup().setLatLng([lat, lng]).setContent(`
    <div class="popup-content" style="min-width: 280px;">
        <div class="popup-title">Catat Penyaluran Bantuan</div>
        <div style="background-color: #e8f8f5; border-left: 4px solid #27ae60; padding: 8px; margin-bottom: 12px; font-size: 0.85rem; border-radius: 2px;">Rekomendasi Kategori: <b>${status}</b></div>
        <div style="display:flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
            <div style="flex: 1 1 45%;"><label>Beras (kg)</label><input type="number" id="b_beras" value="${beras}"></div>
            <div style="flex: 1 1 45%;"><label>Minyak (L)</label><input type="number" id="b_minyak" value="${minyak}"></div>
            <div style="flex: 1 1 45%;"><label>Gula (kg)</label><input type="number" id="b_gula" value="${gula}"></div>
            <div style="flex: 1 1 45%;"><label>Telur (kg)</label><input type="number" id="b_telur" value="${telur}"></div>
            <div style="flex: 1 1 45%;"><label>Susu (Kaleng)</label><input type="number" id="b_susu" value="${susu}"></div>
            <div style="flex: 1 1 45%;"><label>Tunai (Rp)</label><input type="number" id="b_uang" value="${uang}"></div>
        </div>
        <label>Catatan Opsional</label><input type="text" id="b_catatan" placeholder="Cth: Disesuaikan...">
        <button class="btn-save" onclick="simpanLogBantuan(${id_penduduk}, ${id_musibah})">Simpan Log</button>
    </div>`).openOn(map);
}

window.simpanLogBantuan = async function(id_penduduk, id_musibah) {
    const fd = new FormData();
    fd.append('id_penduduk', id_penduduk); fd.append('id_ibadah', ADMIN_ID_IBADAH);
    if (id_musibah !== null && id_musibah !== undefined) { fd.append('id_musibah', id_musibah); }
    fd.append('beras_kg', document.getElementById('b_beras').value); fd.append('minyak_l', document.getElementById('b_minyak').value);
    fd.append('gula_kg', document.getElementById('b_gula').value); fd.append('telur_kg', document.getElementById('b_telur').value);
    fd.append('susu_kaleng', document.getElementById('b_susu').value); fd.append('uang_tunai', document.getElementById('b_uang').value);
    fd.append('catatan', document.getElementById('b_catatan').value);

    const res = await (await fetch('api/transaksi/tambah_log_bantuan.php', { method: 'POST', body: fd })).json();
    if (res.status === 'success') { alert("Berhasil dicatat!"); location.reload(); } else { alert("Gagal menyimpan."); }
}

// --- FUNGSI MODAL LEBAR (Riwayat Bantuan & Pelatihan) ---
window.lihatRiwayat = async function(id_penduduk, nama_kk, lat, lng) {
    map.closePopup();
    document.getElementById('rbModalTitle').innerText = "📜 Riwayat Penyaluran Bantuan: Keluarga " + nama_kk;
    document.getElementById('riwayatBantuanModal').style.display = "block";
    document.getElementById('rbModalBody').innerHTML = `<p style="text-align:center;">Memuat data riwayat...</p>`;

    try {
        const data = await (await fetch(`api/transaksi/get_log_bantuan.php?id_penduduk=${id_penduduk}`)).json();
        let tableRows = '';
        if(data.length > 0) {
            data.forEach(log => {
                let catatanTeks = (log.catatan !== undefined && log.catatan !== null && log.catatan !== '') ? log.catatan : '-';
                tableRows += `
                    <tr>
                        <td style="width: 15%; font-weight: bold;">${log.tanggal_penyaluran}</td>
                        <td style="width: 25%; font-style: italic; color: #555;">${catatanTeks}</td>
                        <td style="line-height: 1.8;">
                            <b>Beras:</b> ${log.beras_kg} Kg; &nbsp; <b>Minyak:</b> ${log.minyak_l} L; &nbsp; <b>Gula:</b> ${log.gula_kg} Kg <br>
                            <b>Telur:</b> ${log.telur_kg} Kg; &nbsp; <b>Susu:</b> ${log.susu_kaleng} Kaleng; &nbsp; <b>Uang:</b> Rp${log.uang_tunai}
                        </td>
                    </tr>`;
            });
        } else { tableRows = `<tr><td colspan="3" style="text-align:center; padding: 15px;">Belum ada riwayat.</td></tr>`; }

        document.getElementById('rbModalBody').innerHTML = `
            <div style="max-height: 50vh; overflow-y: auto;">
                <table class="history-table" style="width: 100%;">
                    <thead><tr><th>Tanggal</th><th>Catatan / Topik</th><th>Rincian Item Penyaluran</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>`;
    } catch (e) { document.getElementById('rbModalBody').innerHTML = `<p style="text-align:center; color:red;">Gagal memuat data.</p>`; }
}

window.lihatLogPelatihan = async function(id_penduduk, nama_kk, lat, lng) {
    map.closePopup();
    document.getElementById('rpModalTitle').innerText = "🎓 Riwayat Pelatihan: Keluarga " + nama_kk;
    document.getElementById('riwayatPelatihanModal').style.display = "block";
    document.getElementById('rpModalBody').innerHTML = `<p style="text-align:center;">Memuat data riwayat pelatihan...</p>`;
    
    try {
        const data = await (await fetch(`api/transaksi/get_log_pelatihan.php?id_penduduk=${id_penduduk}`)).json();
        let tableRows = '';
        if(data.length > 0) {
            data.forEach(log => {
                let statusColor = log.status_kelulusan === 'Lulus' ? 'color: #27ae60;' : (log.status_kelulusan === 'Sedang Berjalan' ? 'color: #f39c12;' : 'color: #c0392b;'); 
                tableRows += `
                    <tr>
                        <td style="width: 35%;"><b>${log.nama_lengkap}</b><br><small style="color:#7f8c8d;">Daftar: ${log.tanggal_daftar}</small></td>
                        <td style="width: 45%;">${log.nama_pelatihan}<br><small>Oleh: ${log.penyelenggara}</small></td>
                        <td style="width: 20%; font-weight:bold; ${statusColor}">${log.status_kelulusan}</td>
                    </tr>`;
            });
        } else { tableRows = `<tr><td colspan="3" style="text-align:center; padding: 15px;">Belum ada riwayat.</td></tr>`; }

        document.getElementById('rpModalBody').innerHTML = `
            <div style="max-height: 50vh; overflow-y: auto;">
                <table class="history-table" style="width: 100%;">
                    <thead><tr><th>Nama Anggota</th><th>Program Pelatihan</th><th>Status</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>`;
    } catch (error) { document.getElementById('rpModalBody').innerHTML = `<p style="text-align:center; color:red;">Gagal memuat log.</p>`; }
}

// --- FUNGSI SUPER ADMIN KHUSUS ---
window.updateGarisKemiskinan = async function() {
    let newVal = document.getElementById('input_gk').value;
    if(!newVal || newVal < 100000) { alert("Masukkan nilai yang valid!"); return; }
    const fd = new FormData(); fd.append('garis_kemiskinan', newVal);
    await fetch('api/sistem/update_pengaturan.php', { method: 'POST', body: fd });
    alert("Garis Kemiskinan berhasil diperbarui!"); location.reload();
}

window.bukaModalMasterPelatihan = async function() {
    document.getElementById('masterPelatihanModal').style.display = "block";
    memuatDaftarMasterPelatihan();
}

window.memuatDaftarMasterPelatihan = async function() {
    try {
        const res = await fetch('api/transaksi/get_master_pelatihan.php');
        const data = await res.json();
        let html = `<table class="history-table"><thead><tr><th>Nama Pelatihan</th><th>Penyelenggara</th><th>Periode</th></tr></thead><tbody>`;
        if(data.length > 0) {
            data.forEach(p => {
                html += `<tr><td><b>${p.nama_pelatihan}</b></td><td>${p.penyelenggara}</td><td>${p.tanggal_mulai} s/d ${p.tanggal_selesai}</td></tr>`;
            });
        } else { html += `<tr><td colspan="3" style="text-align:center;">Belum ada program aktif.</td></tr>`; }
        html += `</tbody></table>`;
        document.getElementById('listMasterPelatihan').innerHTML = html;
    } catch(e) { document.getElementById('listMasterPelatihan').innerHTML = "Gagal memuat data."; }
}

window.simpanMasterPelatihan = async function() {
    const fd = new FormData();
    fd.append('nama_pelatihan', document.getElementById('mp_nama').value);
    fd.append('penyelenggara', document.getElementById('mp_instansi').value);
    fd.append('tanggal_mulai', document.getElementById('mp_mulai').value);
    fd.append('tanggal_selesai', document.getElementById('mp_selesai').value);
    fd.append('deskripsi', document.getElementById('mp_deskripsi').value);

    if(!fd.get('nama_pelatihan') || !fd.get('tanggal_mulai')) { alert("Data tidak lengkap!"); return; }
    const res = await (await fetch('api/transaksi/tambah_master_pelatihan.php', { method: 'POST', body: fd })).json();
    if(res.status === 'success') { alert("Berhasil ditambahkan!"); memuatDaftarMasterPelatihan(); } else { alert("Gagal: " + res.pesan); }
}

function tampilkanFormIbadah(layerOrId, id, nama, jenis, radius, alamat, mode) {
    const formHtml = `<div class="popup-content"><div class="popup-title">${mode === 'tambah' ? 'Tambah' : 'Edit'} Tempat Ibadah</div><label>Nama Institusi</label><input type="text" id="i_nama" value="${nama}"><label>Jenis</label><select id="i_jenis"><option value="Masjid" ${jenis==='Masjid'?'selected':''}>Masjid</option><option value="Gereja Katolik" ${jenis==='Gereja Katolik'?'selected':''}>Gereja Katolik</option><option value="Gereja Protestan" ${jenis==='Gereja Protestan'?'selected':''}>Gereja Protestan</option><option value="Vihara" ${jenis==='Vihara'?'selected':''}>Vihara</option><option value="Pura" ${jenis==='Pura'?'selected':''}>Pura</option><option value="Klenteng" ${jenis==='Klenteng'?'selected':''}>Klenteng</option></select><label>Radius Pelayanan (Meter)</label><input type="number" id="i_radius" value="${radius}"><label>Alamat</label><input type="text" id="i_alamat" value="${alamat}"><button class="btn-save" onclick="simpanIbadah(${id}, '${mode}')">Simpan Institusi</button></div>`;
    if (mode === 'tambah') layerOrId.setPopupContent(formHtml); else L.popup().setLatLng([tempLat, tempLng]).setContent(formHtml).openOn(map);
}
window.editIbadah = function(id, nama, jenis, radius, alamat, lat, lng) { tempLat = lat; tempLng = lng; map.closePopup(); tampilkanFormIbadah(null, id, nama, jenis, radius, alamat, 'edit'); }
window.simpanIbadah = async function(id, mode) {
    const fd = new FormData(); if (mode === 'edit') fd.append('id', id);
    fd.append('latitude', tempLat); fd.append('longitude', tempLng); fd.append('nama', document.getElementById('i_nama').value); fd.append('jenis', document.getElementById('i_jenis').value); fd.append('radius', document.getElementById('i_radius').value); fd.append('alamat', document.getElementById('i_alamat').value);
    await fetch(mode === 'tambah' ? 'api/ibadah/tambah_ibadah.php' : 'api/ibadah/update_ibadah.php', { method: 'POST', body: fd }); location.reload();
}
window.hapusIbadah = async function(id) { if (confirm("Hapus Institusi ini?")) { await fetch(`api/ibadah/hapus_ibadah.php?id=${id}`); location.reload(); } }

// Memulai Aplikasi setelah semua kode siap
initWebGIS();