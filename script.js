    // Set default global DataTables
    $.extend(true, $.fn.dataTable.defaults, {
      order: [[0, "desc"]] // urutkan kolom ke-1 DESC
    });

    // === Helper SweetAlert ===
    function showSwal(type, title, text, duration = 2000, spinnerColor = "#09f") {
      const icons = {
        success: "success",
        error: "error",
        warning: "warning",
        info: "info"
      };

      if (type === "loading") {
        return swal({
          title: title,
          text: text,
          buttons: false,
          closeOnClickOutside: false,
          closeOnEsc: false,
          content: {
            element: "div",
            attributes: { innerHTML: '<div class="swal-spinner" style="border-left-color:${spinnerColor}"></div>' }
          }
        });
      }

      return swal({
        title: title,
        text: text,
        icon: icons[type] || "info",
        buttons: false,
        timer: duration,
        closeOnClickOutside: true,
        closeOnEsc: true
      });
    }

    // === Helper SweetAlert (Konfirmasi) ===
    function showSwalConfirm(title, text, confirmText = "Ya", cancelText = "Batal") {
      return swal({
        title: title,
        content: {
          element: "p",
          attributes: {
            innerHTML: text,
            style: "text-align:center;"
          }
        },
        icon: "warning",
        buttons: [cancelText, confirmText],
        dangerMode: true
      });
    }

    function showSwalConfirmSingle(title, text, confirmText = "OK") {
      return swal({
        title: title,
        text: text,
        icon: "warning",
        buttons: {
          confirm: {
            text: confirmText,
            value: true,
            visible: true,
            className: "btn-danger",
            closeModal: true
          }
        },
        dangerMode: true
      });
    }
    
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
      pageLength: 6, // tampilkan 6 data per halaman

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
          { name: "desktop", width: 1200 },
          { name: 'tablet',  width: 1024 },
          { name: 'mobile',  width: 768 }
        ]
      },

      columnDefs: [
        { targets: 0, className: "desktop" },   // ID tampil di desktop
        { responsivePriority: 1, targets: 1 },  // Nama wajib tampil
        { responsivePriority: 2, targets: 2 },  // Catatan wajib tampil
        { targets: 3, className: "desktop" },  // Rencana
        { targets: 4, className: "desktop" },  // Timestamp
        { targets: 5, className: "desktop" },  // Status
        { targets: 6, className: "desktop" }   // Aksi
      ],
    });

      // Reload Table dengan SweetAlert
      $("#reloadTable").on("click", function () {
        showSwal("loading", "Memuat Data Ulang...", "Sedang ambil data terbaru", null, "orange");

        table.ajax.reload(function () {
          swal.close(); // tutup popup loading
          showSwal("success", "Berhasil!", "Data pasien berhasil diperbarui", 1500);
        }, false);
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

      // Cegah modal tertutup karena klik luar
      $('#myModal').modal({
        backdrop: 'static'
      });

      // Reset modal title saat ditutup
      $('#myModal').on('hidden.bs.modal', () => {
        $('#formPasien')[0].reset();
        $('#idPasien').val('');
        $('#waktuForm').val(''); // reset waktuForm
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
          showSwal("error", "Gagal!", "Nama pasien dan catatan wajib diisi ya !");
          return;
        }

        // Ubah tombol jadi loading
        $btn.prop("disabled", true).html(
          `<span class="spinner-border spinner-border-sm me-2"></span> Menyimpan...`
        );
      
        // Tampilkan pesan loading swal
        showSwal("loading", "Menyimpan...", "Data sedang disimpan", null, "green");
      
        const action = idPasien ? "update" : "insert";
        const payload = {
          id: idPasien,
          nama: namaPasien,
          catatan: catatan,
          rencana: rencana,
          status: status
        };

        $.ajax({
          url: `${BASE_URL}?action=${action}`,
          type: "GET",
          data: payload,
          dataType: "json"
        })
          .done((result) => {
            if (result.success) {
              showSwal("success", "Sukses!", result.message, 1500);
              $('#myModal').modal('hide');
              table.ajax.reload();
            } else {
              showSwal("error", "Gagal!", result.message);
            }
          })
          .fail(() => {
            showSwal("error", "Error!", "Gagal menghubungi server.");
          })
          .always(() => {
            $btn.prop("disabled", false).html("Simpan Data");
          });
      });

      // Hapus Pasien
      $('#data-IGD tbody').on('click', 'button.hapus', function () {
      const tr = $(this).closest('tr');
      const row = table.row(tr.hasClass('child') ? tr.prev() : tr);
      const data = row.data();

      showSwalConfirm(
      `Hapus pasien ${data.nama}?`,
      "Data yang sudah dihapus tidak bisa dikembalikan!",
      "Ya, Hapus",
      "Batal"
      ).then((willDelete) => {
        if (willDelete) {
          showSwal("loading", "Mohon tunggu...", "Sedang menghapus data pasien", null, "red");

          $.ajax({
            url: `${BASE_URL}?action=delete`,
            type: "GET",
            data: { id: data.id },
            dataType: "json"
          })
            .done((result) => {
              if (result.success) {
                showSwal("success", "Sukses!", result.message, 1500);
                table.ajax.reload();
              } else {
                showSwal("error", "Gagal!", result.message);
              }
            })
            .fail(() => {
              showSwal("error", "Error!", "Gagal menghubungi server.");
            });
        }
      });
    });
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
