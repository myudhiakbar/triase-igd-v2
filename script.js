    // JS HTML TO SPREADSHEET
    $(document).ready(function () {
      const BASE_URL = "https://script.google.com/macros/s/AKfycbwrtBHwjpS9Ise8WIyZthtneG7Px_4YQCLTt-7Hb4mJtYILCJ6GKIZ29DhIlGhsoIYNVg/exec";
      
      const table = $("#data-IGD").DataTable({
      ajax: BASE_URL + "?action=get-pasien",
      columns: [
        { data: "id" },
        { data: "nama" },
        { data: "catatan" },
        { data: "rencana" },
        { data: "timestamp",
          render: function (data) {
            return formatTimestampSingkat(data);
          }
        },
        { data: "status" },
        {
          data: null,
          orderable: false,
          render: function () {
            return `
              <div class="btn-group">
                <button class="btn btn-warning btn-sm edit">Edit</button>
                <button class="btn btn-danger btn-sm hapus">Hapus</button>
              </div>
            `;
          }
        },
      ],
      rowId: "id",

      // rowCallback untuk memberi class khusus
      rowCallback: function(row, data) {
        if (data.rencana && data.rencana.trim() !== "") {
          $(row).addClass("row-rencana-isi");   // kasih class khusus
        } else {
          $(row).removeClass("row-rencana-isi"); // kalau kosong hapus class
        }
        if (data.status && data.status.toLowerCase() === "batal") {
        $(row).addClass("row-status-batal");
        } else {
          $(row).removeClass("row-status-batal");
        }
      },

      responsive: {
        breakpoints: [
          { name: 'desktop', width: Infinity },
          { name: 'tablet',  width: 1024 },
          { name: 'mobile',  width: 768 }
        ]
      },

      pageLength: 6, // tampilkan 6 data per halaman

      columnDefs: [
        { targets: 0, className: "desktop" },   // ID hanya tampil di desktop
        { responsivePriority: 1, targets: 1 },  // Nama wajib tampil
        { responsivePriority: 2, targets: 2 },  // Catatan wajib tampil
        { targets: 3, className: "desktop" },  // Rencana bisa disembunyikan
        { targets: 4, className: "desktop" },  // Timestamp bisa disembunyikan
        { targets: 5, className: "desktop" },  // Status bisa disembunyikan
        { targets: 6, className: "desktop" }   // Aksi bisa disembunyikan
      ],
    });

      // Edit Pasien
      $('#data-IGD tbody').on('click', 'button.edit', function () {
        const tr = $(this).closest('tr');
        const row = table.row(tr.hasClass('child') ? tr.prev() : tr);
        const data = row.data();

        $("#myModal .modal-title").text("Edit Pasien");
        $('#idPasien').val(data.id);
        $('#namaPasien').val(data.nama);
        $('#catatan').val(data.catatan);
        $("#rencana").val(data.rencana || "");
        $("#status").val(data.status || "");
        $("#fieldRencana, #fieldStatus").removeClass("d-none");
        $('#myModal').modal('show');
      });

      // Reset modal title saat ditutup
      $('#myModal').on('hidden.bs.modal', () => {
        $('#formPasien')[0].reset();
        $('#idPasien').val('');
        $('#myModal .modal-title').text('Tambah Pasien');
        $("#fieldRencana, #fieldStatus").addClass("d-none"); // ikut reset
      });

      // Tambah Pasien
      $('#tambahPasien').on('click', () => {
        $('#formPasien')[0].reset();
        $('#idPasien').val('');
        $("#myModal .modal-title").text("Tambah Pasien");
        $("#fieldRencana, #fieldStatus").addClass("d-none");
        $('#myModal').modal('show');
      });

      // Simpan Pasien
      $('#simpanPasien').on('click', function () {
        const $btn = $(this); // simpan referensi tombol
        const idPasien = $('#idPasien').val();
        const namaPasien = $('#namaPasien').val().trim();
        const catatan = $('#catatan').val().trim();
        const rencana = $('#rencana').val().trim();
        const status = $('#status').val().trim();
      
        if (!namaPasien || !catatan) {
          swal({
            title: "Gagal!",
            text: "Mohon lengkapi kolom yang dibintangi ya!",
            icon: "error",
            buttons: false,   // 🔹 Hilangkan tombol OK
            timer: 2000       // 🔹 Auto close dalam 2 detik
          });
          return;
        }

        // 🔹 Ubah tombol jadi loading
        $btn.prop("disabled", true).html(
          `<span class="spinner-border spinner-border-sm me-2"></span> Menyimpan...`
        );
      
        // 🔹 Tampilkan pesan loading swal
        swal({
          title: "Menyimpan...",
          text: "Mohon tunggu sebentar",
          buttons: false,
          closeOnClickOutside: false,
          closeOnEsc: false,
          icon: "info"
        });
      
        let apiURL = "";
        if (idPasien) {
          apiURL = `${BASE_URL}?action=update&id=${idPasien}&nama=${encodeURIComponent(namaPasien)}&catatan=${encodeURIComponent(catatan)}&rencana=${encodeURIComponent(rencana)}&status=${encodeURIComponent(status)}`;
        } else {
          apiURL = `${BASE_URL}?action=insert&nama=${encodeURIComponent(namaPasien)}&catatan=${encodeURIComponent(catatan)}&rencana=${encodeURIComponent(rencana)}&status=${encodeURIComponent(status)}`;
        }
      
        $.getJSON(apiURL, function (result) {
          if (result.success) {
            swal({
              title: "Sukses!",
              text: result.message,
              icon: "success",
              buttons: false,
              timer: 1500
            });
            $('#myModal').modal('hide');
            table.ajax.reload();
          } else {
            swal({
              title: "Gagal!",
              text: result.message,
              icon: "error",
              buttons: false,
              timer: 2000
            });
          }
        }).fail(() => {
          swal({
            title: "Error!",
            text: "Gagal menghubungi server.",
            icon: "error",
            buttons: false,
            timer: 2000
          });
        }).always(() => {
          // 🔹 Reset tombol kembali normal
          $btn.prop("disabled", false).text("Simpan Data");
        });
      });

      // Hapus Pasien
      $('#data-IGD tbody').on('click', 'button.hapus', function () {
      const tr = $(this).closest('tr');
      const row = table.row(tr.hasClass('child') ? tr.prev() : tr);
      const data = row.data();

      swal({
        title: `Hapus pasien ${data.nama}?`,
        text: "Data yang sudah dihapus tidak bisa dikembalikan!",
        icon: "warning",
        buttons: ["Batal", "Ya, Hapus"],
        dangerMode: true
      }).then((willDelete) => {
        if (willDelete) {
          const apiURL = `${BASE_URL}?action=delete&id=${data.id}`;
          $.getJSON(apiURL, function (result) {
            if (result.success) {
              swal({
                title: "Sukses!",
                text: result.message,
                icon: "success",
                buttons: false,
                timer: 1500
              });
              table.ajax.reload();
            } else {
              swal({
                title: "Gagal!",
                text: result.message,
                icon: "error",
                buttons: false,
                timer: 2000
              });
            }
          }).fail(() => {
            swal({
              title: "Error!",
              text: "Gagal menghubungi server.",
              icon: "error",
              buttons: false,
              timer: 2000
            });
          });
        }
      });
    });
    });

    // ✅ Set default global DataTables
      $.extend(true, $.fn.dataTable.defaults, {
        order: [[4, "desc"]] // urutkan kolom ke-5 (Timestamp) DESC
      });

    // === Time Update ===
    function updateWaktu() {
      const now = new Date();
      const tanggal = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    
      const pad = (n) => String(n).padStart(2, '0');
      const jam = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const fullText = `${tanggal} , ${jam} WIB`;
    
      // Update teks header
      document.getElementById("waktuSekarang").innerHTML = fullText;
    
      // Kalau modal sedang terbuka, update juga ke form
      if ($('#myModal').hasClass('show')) {
        $('#waktuForm').val(fullText);
      }
    }
    
    updateWaktu();
    setInterval(updateWaktu, 1000);

    // === Formatter Timestamp Singkat ===
    function formatTimestampSingkat(data) {
      if (!data) return "-";
      const date = new Date(data);

      const pad = (n) => String(n).padStart(2, "0");
      const tgl = pad(date.getDate());
      const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
                 "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const bln = bulan[date.getMonth()];
      const thn = date.getFullYear();

      const jam = pad(date.getHours());
      const menit = pad(date.getMinutes());
      const detik = pad(date.getSeconds());

      return `${tgl} ${bln} ${thn} , ${jam}:${menit}:${detik} WIB`;
    }
