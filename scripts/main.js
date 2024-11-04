// main.js

import { processData, isValidFileType } from "./dataProcessor.js";
import { renderCharts } from "./chartRenderer.js";

class AppConfig {
  static get NOTIFICATION_DURATION() {
    return 5000;
  }
  static get SUPPORTED_EXPORT_FORMATS() {
    return ["pdf", "png", "jpg", "xlsx"];
  }
  static get PDF_CONFIG() {
    return {
      orientation: "l",
      unit: "mm",
      format: "a4",
      margins: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
      },
    };
  }
}

class ExcelExporter {
  static createWorkbook(data) {
    const wb = XLSX.utils.book_new();

    // Criar planilha de frequência de jobs
    const jobFrequencySheet = this.createJobFrequencySheet(data);
    XLSX.utils.book_append_sheet(wb, jobFrequencySheet, "Frequência de Jobs");

    // Criar planilha de frequência de agentes
    const agentFrequencySheet = this.createAgentFrequencySheet(data);
    XLSX.utils.book_append_sheet(
      wb,
      agentFrequencySheet,
      "Frequência de Agentes"
    );

    // Criar planilha de durações
    const durationSheet = this.createDurationSheet(data);
    XLSX.utils.book_append_sheet(wb, durationSheet, "Durações Médias");

    // Criar planilha de estatísticas
    const statsSheet = this.createStatsSheet(data);
    XLSX.utils.book_append_sheet(wb, statsSheet, "Estatísticas");

    return wb;
  }

  static createJobFrequencySheet(data) {
    const sheetData = [["Job Name", "Frequência"]];

    data.jobNames.forEach((name, index) => {
      sheetData.push([name, data.jobFrequencies[index]]);
    });

    return XLSX.utils.aoa_to_sheet(sheetData);
  }

  static createAgentFrequencySheet(data) {
    const sheetData = [["Agent Name", "Frequência"]];

    data.agentNames.forEach((name, index) => {
      sheetData.push([name, data.agentFrequencies[index]]);
    });

    return XLSX.utils.aoa_to_sheet(sheetData);
  }

  static createDurationSheet(data) {
    const sheetData = [["Job Name", "Duração Média (minutos)"]];

    data.jobNames.forEach((name, index) => {
      sheetData.push([name, data.averageDurations[index]]);
    });

    return XLSX.utils.aoa_to_sheet(sheetData);
  }

  static createStatsSheet(data) {
    const { statistics } = data;
    const sheetData = [
      ["Métrica", "Valor"],
      ["Total de Registros", statistics.totalRows],
      ["Registros Processados", statistics.processedRows],
      ["Registros com Erro", statistics.errorRows],
      ["Taxa de Sucesso", `${statistics.successRate}%`],
    ];

    return XLSX.utils.aoa_to_sheet(sheetData);
  }

  static formatSheet(sheet) {
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const colWidths = [];

    // Calcular larguras das colunas
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLen = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.v) {
          const len = cell.v.toString().length;
          if (len > maxLen) maxLen = len;
        }
      }
      colWidths[C] = maxLen + 2;
    }

    sheet["!cols"] = colWidths.map((w) => ({ wch: w }));
    return sheet;
  }
}

class UIElements {
  constructor() {
    this.fileInput = document.getElementById("fileInput");
    this.processButton = document.getElementById("processButton");
    this.exportButton = document.getElementById("exportChartsButton");
    this.loadingIndicator = document.getElementById("loadingIndicator");
    this.errorContainer = document.getElementById("errorContainer");
    this.fileInfo = document.getElementById("fileInfo");
    this.statsContainer = document.getElementById("statsContainer");
    this.notificationContainer = document.getElementById(
      "notificationContainer"
    );
    this.exportOptions = document.querySelector(".export-options");
    this.container = document.querySelector(".container");

    this.validateElements();
  }

  validateElements() {
    const requiredElements = {
      fileInput: this.fileInput,
      processButton: this.processButton,
      exportButton: this.exportButton,
      loadingIndicator: this.loadingIndicator,
      errorContainer: this.errorContainer,
      fileInfo: this.fileInfo,
      statsContainer: this.statsContainer,
      notificationContainer: this.notificationContainer,
      container: this.container,
    };

    for (const [name, element] of Object.entries(requiredElements)) {
      if (!element) {
        throw new Error(`Elemento UI necessário não encontrado: ${name}`);
      }
    }
  }
}

class NotificationManager {
  constructor(container) {
    this.container = container;
  }

  show(type, message, duration = AppConfig.NOTIFICATION_DURATION) {
    const notification = this.createNotification(type, message);
    this.container.appendChild(notification);
    this.setupAutoRemoval(notification, duration);
  }

  createNotification(type, message) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <span>${message}</span>
            <button class="close-btn">&times;</button>
        `;

    notification.querySelector(".close-btn").addEventListener("click", () => {
      this.remove(notification);
    });

    return notification;
  }

  remove(notification) {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }

  setupAutoRemoval(notification, duration) {
    setTimeout(() => {
      if (notification.parentElement) {
        this.remove(notification);
      }
    }, duration);
  }
}

class FileHandler {
  constructor(app) {
    this.app = app;
    this.currentFile = null;
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    this.validateAndSetFile(file);
  }

  handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    this.app.ui.container.classList.remove("dragover");
    const file = event.dataTransfer.files[0];
    this.validateAndSetFile(file);
  }

  validateAndSetFile(file) {
    if (!file) {
      this.app.notifications.show("error", "Nenhum arquivo selecionado");
      return false;
    }

    if (!isValidFileType(file)) {
      this.app.notifications.show(
        "error",
        "Formato de arquivo não suportado. Use CSV, XLS ou XLSX."
      );
      return false;
    }

    this.currentFile = file;
    this.updateFileInfo(file);
    this.app.ui.processButton.disabled = false;
    this.app.ui.exportButton.disabled = true;
    return true;
  }

  updateFileInfo(file) {
    const fileSize = this.formatFileSize(file.size);
    this.app.ui.fileInfo.innerHTML = `
            <div class="file-details">
                <h3>Arquivo Selecionado</h3>
                <p><strong>Nome:</strong> ${file.name}</p>
                <p><strong>Tipo:</strong> ${file.type || "Não especificado"}</p>
                <p><strong>Tamanho:</strong> ${fileSize}</p>
            </div>
        `;
    this.app.ui.fileInfo.classList.remove("hidden");
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
// Continuação do main.js

class ExportManager {
  constructor(app) {
    this.app = app;
  }

  async handleExport(format) {
    if (!AppConfig.SUPPORTED_EXPORT_FORMATS.includes(format)) {
      this.app.notifications.show("error", "Formato de exportação inválido");
      return;
    }

    try {
      this.app.setLoading(true);
      this.app.ui.exportOptions.classList.add("hidden");

      if (format === "pdf") {
        await this.exportToPDF();
      } else {
        await this.exportToImage(format);
      }

      this.app.notifications.show(
        "success",
        "Exportação concluída com sucesso"
      );
    } catch (error) {
      console.error("Erro na exportação:", error);
      this.app.notifications.show("error", "Erro ao exportar gráficos");
    } finally {
      this.app.setLoading(false);
    }
  }

  async exportToPDF() {
    const charts = document.querySelectorAll(".chart-container");
    if (!charts.length) {
      throw new Error("Nenhum gráfico encontrado para exportar");
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF(
      AppConfig.PDF_CONFIG.orientation,
      AppConfig.PDF_CONFIG.unit,
      AppConfig.PDF_CONFIG.format
    );

    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = AppConfig.PDF_CONFIG.margins.top;

    const usableWidth = pageWidth - 2 * margin;
    const usableHeight = pageHeight - 2 * margin;
    const chartWidth = usableWidth / 2;
    const chartHeight = usableHeight / 2;

    for (let i = 0; i < charts.length; i++) {
      if (i > 0 && i % 4 === 0) {
        pdf.addPage();
      }

      const chart = charts[i];
      const canvas = chart.querySelector("canvas");
      const title =
        chart.querySelector("h3")?.textContent || `Gráfico ${i + 1}`;

      const row = Math.floor((i % 4) / 2);
      const col = i % 2;
      const x = margin + col * chartWidth;
      const y = margin + row * chartHeight;

      try {
        const imgData = canvas.toDataURL("image/png", 1.0);

        pdf.setFontSize(12);
        pdf.text(title, x + 2, y + 6);

        pdf.addImage(
          imgData,
          "PNG",
          x + 2,
          y + 8,
          chartWidth - 4,
          chartHeight - 12
        );
      } catch (error) {
        console.error(`Erro ao processar gráfico ${i + 1}:`, error);
        throw new Error(`Erro ao processar gráfico ${i + 1}`);
      }
    }

    pdf.save("analise-graficos.pdf");
  }

  async exportToImage(format) {
    const canvas = document.querySelector(".chart-container canvas");
    if (!canvas) {
      throw new Error("Nenhum gráfico encontrado para exportar");
    }

    try {
      const dataUrl = canvas.toDataURL(`image/${format}`, 1.0);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `grafico.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      throw new Error(`Erro ao exportar imagem: ${error.message}`);
    }
  }
  async handleExport(format) {
    if (!AppConfig.SUPPORTED_EXPORT_FORMATS.includes(format)) {
      this.app.notifications.show("error", "Formato de exportação inválido");
      return;
    }

    try {
      this.app.setLoading(true);
      this.app.ui.exportOptions.classList.add("hidden");

      switch (format) {
        case "pdf":
          await this.exportToPDF();
          break;
        case "xlsx":
          await this.exportToExcel();
          break;
        default:
          await this.exportToImage(format);
      }

      this.app.notifications.show(
        "success",
        "Exportação concluída com sucesso"
      );
    } catch (error) {
      console.error("Erro na exportação:", error);
      this.app.notifications.show("error", "Erro ao exportar dados");
    } finally {
      this.app.setLoading(false);
    }
  }

  async exportToExcel() {
    try {
      // Obter dados processados do estado da aplicação
      const processedData = this.app.getProcessedData();
      if (!processedData) {
        throw new Error("Nenhum dado disponível para exportação");
      }

      // Criar workbook
      const wb = ExcelExporter.createWorkbook(processedData);

      // Exportar arquivo
      XLSX.writeFile(wb, "analise-dados.xlsx");
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      throw new Error("Falha ao gerar arquivo Excel");
    }
  }
}

class App {
  constructor() {
    try {
      this.initialize();
    } catch (error) {
      console.error("Erro ao inicializar aplicação:", error);
      this.showFatalError(error);
    }
  }

  initialize() {
    // Inicializar estado
    this.state = {
      isProcessing: false,
      processedData: null,
      currentFile: null,
    };

    // Inicializar componentes
    this.ui = new UIElements();
    this.notifications = new NotificationManager(this.ui.notificationContainer);
    this.fileHandler = new FileHandler(this);
    this.exportManager = new ExportManager(this);

    // Configurar eventos
    this.setupEventListeners();
    this.initializeState();
  }

  initializeState() {
    this.ui.processButton.disabled = true;
    this.ui.exportButton.disabled = true;
  }

  setupEventListeners() {
    // File Input
    this.ui.fileInput.addEventListener("change", (e) =>
      this.fileHandler.handleFileSelect(e)
    );

    // Process Button
    this.ui.processButton.addEventListener("click", () => this.processFile());

    // Export Button e Options
    this.setupExportListeners();

    // Drag and Drop
    this.setupDragAndDrop();
  }

  setupExportListeners() {
    // Export Button
    this.ui.exportButton.addEventListener("click", () =>
      this.toggleExportOptions()
    );

    // Export Options
    document.querySelectorAll(".export-option").forEach((button) => {
      button.addEventListener("click", (e) => {
        const format = e.target.dataset.format;
        if (format) {
          this.handleExport(format);
        }
      });
    });

    // Fechar export options ao clicar fora
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".export-controls")) {
        this.ui.exportOptions?.classList.add("hidden");
      }
    });
  }

  setupDragAndDrop() {
    const container = this.ui.container;

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      container.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    container.addEventListener("dragover", () => {
      container.classList.add("dragover");
    });

    container.addEventListener("dragleave", () => {
      container.classList.remove("dragover");
    });

    container.addEventListener("drop", (e) => this.fileHandler.handleDrop(e));
  }

  async processFile() {
    if (this.state.isProcessing || !this.fileHandler.currentFile) {
      return;
    }

    try {
      this.state.isProcessing = true;
      this.setLoading(true);
      this.clearError();

      const processedData = await processData(this.fileHandler.currentFile);
      this.state.processedData = processedData;

      this.updateStats(processedData.statistics);

      if (processedData.errors?.length > 0) {
        this.showErrorSummary(processedData.errors);
      }

      await renderCharts(processedData);
      this.ui.exportButton.disabled = false;

      this.notifications.show("success", "Dados processados com sucesso!");
    } catch (error) {
      console.error("Erro no processamento:", error);
      this.notifications.show(
        "error",
        `Erro no processamento: ${error.message}`
      );
    } finally {
      this.state.isProcessing = false;
      this.setLoading(false);
    }
  }

  async handleExport(format) {
    if (!this.state.processedData) {
      this.notifications.show(
        "error",
        "Nenhum dado disponível para exportação"
      );
      return;
    }

    try {
      this.setLoading(true);
      this.ui.exportOptions.classList.add("hidden");

      switch (format) {
        case "xlsx":
          await this.exportToExcel();
          break;
        case "pdf":
          await this.exportToPDF();
          break;
        case "png":
        case "jpg":
          await this.exportToImage(format);
          break;
        default:
          throw new Error("Formato de exportação não suportado");
      }

      this.notifications.show("success", "Exportação concluída com sucesso");
    } catch (error) {
      console.error("Erro na exportação:", error);
      this.notifications.show("error", `Erro na exportação: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  async exportToPDF() {
    try {
      const charts = document.querySelectorAll(".chart-container");
      if (!charts.length) {
        throw new Error("Nenhum gráfico encontrado para exportar");
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("l", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 10;

      const usableWidth = pageWidth - 2 * margin;
      const usableHeight = pageHeight - 2 * margin;
      const chartWidth = usableWidth / 2;
      const chartHeight = usableHeight / 2;

      for (let i = 0; i < charts.length; i++) {
        // Adicionar nova página para cada conjunto de 4 gráficos
        if (i > 0 && i % 4 === 0) {
          pdf.addPage();
        }

        const chart = charts[i];
        const canvas = chart.querySelector("canvas");
        const title =
          chart.querySelector("h3")?.textContent || `Gráfico ${i + 1}`;

        // Calcular posição do gráfico na página
        const row = Math.floor((i % 4) / 2);
        const col = i % 2;
        const x = margin + col * chartWidth;
        const y = margin + row * chartHeight;

        try {
          const imgData = canvas.toDataURL("image/png", 1.0);

          // Adicionar título
          pdf.setFontSize(12);
          pdf.text(title, x + 2, y + 6);

          // Adicionar gráfico
          pdf.addImage(
            imgData,
            "PNG",
            x + 2,
            y + 8,
            chartWidth - 4,
            chartHeight - 12
          );
        } catch (error) {
          console.error(`Erro ao processar gráfico ${i + 1}:`, error);
          throw new Error(`Erro ao processar gráfico ${i + 1}`);
        }
      }

      // Salvar o PDF
      pdf.save("analise-graficos.pdf");
    } catch (error) {
      throw new Error(`Erro ao gerar PDF: ${error.message}`);
    }
  }

  async exportToImage(format) {
    try {
      const charts = document.querySelectorAll(".chart-container");
      if (!charts.length) {
        throw new Error("Nenhum gráfico encontrado para exportar");
      }

      // Para cada gráfico, criar um arquivo separado
      charts.forEach((chart, index) => {
        const canvas = chart.querySelector("canvas");
        if (!canvas) {
          console.warn(`Canvas não encontrado para o gráfico ${index + 1}`);
          return;
        }

        const title =
          chart.querySelector("h3")?.textContent || `grafico-${index + 1}`;
        const fileName = `${title
          .toLowerCase()
          .replace(/\s+/g, "-")}.${format}`;

        try {
          // Criar o link de download
          const link = document.createElement("a");
          link.download = fileName;
          link.href = canvas.toDataURL(`image/${format}`, 1.0);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error(`Erro ao exportar gráfico ${index + 1}:`, error);
          throw new Error(`Erro ao exportar gráfico ${index + 1}`);
        }
      });
    } catch (error) {
      throw new Error(`Erro ao exportar imagens: ${error.message}`);
    }
  }

  async exportToExcel() {
    try {
      const wb = XLSX.utils.book_new();

      // Planilha de Frequência de Jobs
      const jobSheet = XLSX.utils.aoa_to_sheet([
        ["Job Name", "Frequência"],
        ...this.state.processedData.jobNames.map((name, i) => [
          name,
          this.state.processedData.jobFrequencies[i],
        ]),
      ]);
      XLSX.utils.book_append_sheet(wb, jobSheet, "Frequência de Jobs");

      // Planilha de Frequência de Agentes
      const agentSheet = XLSX.utils.aoa_to_sheet([
        ["Agent Name", "Frequência"],
        ...this.state.processedData.agentNames.map((name, i) => [
          name,
          this.state.processedData.agentFrequencies[i],
        ]),
      ]);
      XLSX.utils.book_append_sheet(wb, agentSheet, "Frequência de Agentes");

      // Planilha de Durações
      const durationSheet = XLSX.utils.aoa_to_sheet([
        ["Job Name", "Duração Média (minutos)"],
        ...this.state.processedData.jobNames.map((name, i) => [
          name,
          this.state.processedData.averageDurations[i],
        ]),
      ]);
      XLSX.utils.book_append_sheet(wb, durationSheet, "Durações");

      // Exportar
      XLSX.writeFile(wb, "analise-dados.xlsx");
    } catch (error) {
      throw new Error("Falha ao gerar arquivo Excel: " + error.message);
    }
  }

  toggleExportOptions() {
    this.ui.exportOptions?.classList.toggle("hidden");
  }

  updateStats(statistics) {
    if (!statistics) return;

    this.ui.statsContainer.innerHTML = `
          <div class="stats-details">
              <h3>Estatísticas do Processamento</h3>
              <p><strong>Total de Registros:</strong> ${statistics.totalRows}</p>
              <p><strong>Processados:</strong> ${statistics.processedRows}</p>
              <p><strong>Erros:</strong> ${statistics.errorRows}</p>
              <p><strong>Taxa de Sucesso:</strong> ${statistics.successRate}%</p>
          </div>
      `;
    this.ui.statsContainer.classList.remove("hidden");
  }

  setLoading(show) {
    this.ui.loadingIndicator.classList.toggle("hidden", !show);
    this.ui.processButton.disabled = show;
  }

  clearError() {
    this.ui.errorContainer.innerHTML = "";
    this.ui.errorContainer.classList.add("hidden");
  }

  showFatalError(error) {
    const errorMessage = document.createElement("div");
    errorMessage.className = "fatal-error";
    errorMessage.innerHTML = `
          <h2>Erro Fatal</h2>
          <p>A aplicação não pôde ser inicializada:</p>
          <p>${error.message}</p>
      `;
    document.body.appendChild(errorMessage);
  }
}
// Inicialização da aplicação
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
