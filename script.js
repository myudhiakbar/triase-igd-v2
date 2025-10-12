    // Set default global DataTables
    $.extend(true, $.fn.dataTable.defaults, {
      order: [[0, "desc"]] // urutkan kolom ke-1 DESC
    });

    // === Helper SweetAlert2 ===
    function showSwal(type, title, text, duration = 2000, spinnerColor = "#09f") {
      const icons = {
        success: "success",
        error: "error",
        warning: "warning",
        info: "info"
      };

      if (type === "loading") {
      Swal.fire({
        title: title,
        text: text || "",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      return;
    }

    return Swal.fire({
      icon: icons[type] || "info",
      title: title,
      text: text,
      showConfirmButton: false,
      timer: duration,
      allowOutsideClick: true,
      allowEscapeKey: true
    });
    }

    // === Helper SweetAlert2 (Konfirmasi Yes/No) ===
    function showSwalConfirm(title, text, confirmText = "Ya", cancelText = "Batal") {
      return Swal.fire({
        title: title,
        text: text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true
      }).then((result) => result.isConfirmed);
    }

    // === Helper SweetAlert2 (Konfirmasi OK Only) ===
    function showSwalConfirmSingle(title, text, confirmText = "OK") {
      return Swal.fire({
        title: title,
        text: text,
        icon: "warning",
        confirmButtonText: confirmText
      }).then((result) => result.isConfirmed);
    }
    
    // JS HTML TO SPREADSHEET
    $(document).ready(function () {
      const BASE_URL = "https://script.google.com/macros/s/AKfycbzdbGEVZW2U1a9iktQK-b3apmLu0yIXsIQagejZSp77HMWgxhQGEZRDskvK8nUnEHTV/exec";

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
      pageLength: 8, // tampilkan 6 data per halaman

      // rowCallback untuk memberi class khusus
      rowCallback: function(row, data) {
        if (data.rencana && data.rencana.trim() !== "") {
          $(row).addClass("row-rencana-isi");   // kasih class khusus
        } else {
          $(row).removeClass("row-rencana-isi"); // kalau kosong hapus class
        }
        if (data.status && data.status.toLowerCase() === "sudah") {
          $(row).addClass("row-status-sudah");
        } else {
          $(row).removeClass("row-status-sudah");
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
          Swal.close(); // tutup loading
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
          Swal.fire({
            icon: "error",
            title: "Gagal!",
            text: "Nama pasien dan catatan wajib diisi ya!",
            confirmButtonText: "OK"
          });
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
        ).then((confirmed) => {
          if (confirmed) {
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

      // === Inline Editing (dblclick cell) ===
      $('#data-IGD tbody').on('dblclick', 'td', function () {
        const cell = table.cell(this);
        const colIdx = cell.index().column;
        const rowData = table.row(this).data();

        // Batasi kolom edit
        if ([1, 2, 3, 5].includes(colIdx)) {
          const oldValue = cell.data();

          // === Jika kolom STATUS → dropdown
          if (colIdx === 5) {
            const options = ["", "Sudah", "Batal"];
            const $select = $('<select class="form-control form-control-sm"></select>');
            options.forEach(opt => {
              $select.append(
                `<option value="${opt}" ${opt === oldValue ? "selected" : ""}>${opt}</option>`
              );
            });
            $(this).html($select);
            $select.focus();

            const finishEditSelect = () => {
            const newValue = $select.val();
            if (newValue !== oldValue) {
              updateCell(rowData.id, "status", newValue, cell, oldValue);
            } else {
              cell.data(oldValue).draw(false);
            }
            $(document).off("click.outsideSelect keydown.cancelSelect");
            };

            const cancelEditSelect = () => {
              cell.data(oldValue).draw(false); // rollback
              $(document).off("click.outsideSelect keydown.cancelSelect");
            };

            $select.on("change", finishEditSelect);

            // klik di luar → update
            $(document).on("click.outsideSelect", function (e) {
              if (!$select.is(e.target) && $select.has(e.target).length === 0) {
                finishEditSelect();
              }
            });

            // Esc → batal
            $(document).on("keydown.cancelSelect", function (e) {
              if (e.key === "Escape") {
                cancelEditSelect();
              }
            });

            } else {
              // === Kolom text biasa (rencana)
              const $input = $('<textarea class="form-control form-control-sm">').val(oldValue);
              $(this).html($input);
              $input.focus();

              // Atur tinggi awal sesuai isi (auto-resize)
              $input.css({
                "overflow": "hidden",
                "resize": "none",          // biar tidak bisa di-drag manual
                "min-height": "38px",      // tinggi minimum biar tetap rapi
                "line-height": "1.4"
              });

              // Hitung tinggi awal berdasarkan isi lama
              $input[0].style.height = "auto";
              $input[0].style.height = ($input[0].scrollHeight) + "px";

              // Auto resize tinggi textarea
              $input.on("input", function () {
                this.style.height = "auto";   // reset dulu
                this.style.height = (this.scrollHeight) + "px"; // tinggi sesuai isi
              });

              // Flag untuk dibatalkan pakai ESC
              let isCancelled = false;

              const finishEditInput = () => {
                if (isCancelled) return;
                const newValue = $input.val().trim();
                if (newValue !== oldValue) {
                  const fieldMap = { 1: "nama", 2: "catatan", 3: "rencana" };
                  updateCell(rowData.id, fieldMap[colIdx], newValue, cell, oldValue);
                } else {
                  cell.data(oldValue).draw(false);
                }
                $(document).off("click.outsideInput keydown.cancelInput");
              };

            const cancelEditInput = () => {
              isCancelled = true;
              cell.data(oldValue).draw(false); // rollback
              $(document).off("click.outsideInput keydown.cancelInput");
              $input.off("blur");
            };

            $input.on("blur", finishEditInput);

            // klik di luar → update
            $(document).on("click.outsideInput", function (e) {
              if (!$input.is(e.target) && $input.has(e.target).length === 0) {
                finishEditInput();
              }
            });

            // Esc → batal
            $(document).on("keydown.cancelInput", function (e) {
              if (e.key === "Escape") {
                cancelEditInput();
              }
            });
          }
        }
      });

      // === Fungsi update ke server ===
      function updateCell(id, field, newValue, cell, oldValue) {
        showSwal("loading", "Menyimpan...", "Sedang update data");
        $.ajax({
          url: `${BASE_URL}?action=update`,
          type: "GET",
          data: { id: id, [field]: newValue },
          dataType: "json"
        })
          .done((result) => {
            if (result.success) {
              showSwal("success", "Sukses!", result.message, 1500);
              cell.data(newValue).draw(false);
            } else {
              showSwal("error", "Gagal!", result.message);
              cell.data(oldValue).draw(false);
            }
          })
          .fail(() => {
            showSwal("error", "Error!", "Gagal menghubungi server.");
            cell.data(oldValue).draw(false);
          });
      }
    });

    // Copyright Otomatis
    document.getElementById("year").textContent = new Date().getFullYear();

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
