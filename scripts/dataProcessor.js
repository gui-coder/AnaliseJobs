// dataProcessor.js

class DateProcessor {
  static parseDate(value) {
    if (!value) return null;

    try {
      // Se já for um Date
      if (value instanceof Date) {
        return this.validateDate(value);
      }

      // Se for string
      if (typeof value === "string") {
        return this.parseDateString(value);
      }

      // Se for número (Excel)
      if (typeof value === "number") {
        return this.parseExcelDate(value);
      }

      throw new Error("Formato de data não suportado");
    } catch (error) {
      console.error("Erro ao processar data:", value, error);
      return null;
    }
  }

  static parseDateString(value) {
    // Limpar a string
    value = value.trim();

    // Tentar vários formatos
    const formats = [
      // DD/MM/YYYY HH:mm:ss
      {
        regex: /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/,
        parse: (matches) => {
          const [_, day, month, year, hours, minutes, seconds] = matches;
          return new Date(year, month - 1, day, hours, minutes, seconds);
        },
      },
      // YYYY-MM-DD HH:mm:ss
      {
        regex: /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
        parse: (matches) => {
          const [_, year, month, day, hours, minutes, seconds] = matches;
          return new Date(year, month - 1, day, hours, minutes, seconds);
        },
      },
      // Date string format (GMT/UTC)
      {
        regex:
          /^([A-Za-z]{3})\s+([A-Za-z]{3})\s+(\d{2})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+GMT/,
        parse: (matches) => new Date(matches[0]),
      },
    ];

    for (const format of formats) {
      const matches = value.match(format.regex);
      if (matches) {
        const date = format.parse(matches);
        if (this.validateDate(date)) {
          return date;
        }
      }
    }

    // Última tentativa: parse direto
    const date = new Date(value);
    return this.validateDate(date);
  }

  static parseExcelDate(value) {
    const EXCEL_EPOCH = new Date(1899, 11, 30);
    const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

    const date = new Date(EXCEL_EPOCH.getTime() + value * MILLISECONDS_PER_DAY);
    return this.validateDate(date);
  }

  static validateDate(date) {
    if (
      date instanceof Date &&
      !isNaN(date) &&
      date.getFullYear() >= 1900 &&
      date.getFullYear() <= 2100
    ) {
      return date;
    }
    throw new Error("Data inválida");
  }
}

class DataProcessor {
  constructor() {
    this.reset();
  }

  reset() {
    this.jobs = new Map();
    this.agents = new Map();
    this.errors = [];
    this.stats = {
      totalRows: 0,
      processedRows: 0,
      errorRows: 0,
    };
  }

  processRow(row) {
    try {
      const jobName = row["Job Name"]?.trim();
      const agentName = row["Agent Name"]?.trim();

      if (!jobName || !agentName) {
        throw new Error("Job Name ou Agent Name ausente");
      }

      const startTime = DateProcessor.parseDate(row["Start Time"]);
      const endTime = DateProcessor.parseDate(row["End Time"]);

      if (!startTime || !endTime) {
        throw new Error("Datas inválidas");
      }

      // Calcular duração em minutos
      const duration = (endTime - startTime) / (1000 * 60);

      // Atualizar job
      if (!this.jobs.has(jobName)) {
        this.jobs.set(jobName, { count: 0, totalDuration: 0 });
      }
      const job = this.jobs.get(jobName);
      job.count++;
      job.totalDuration += duration;

      // Atualizar agent
      if (!this.agents.has(agentName)) {
        this.agents.set(agentName, { count: 0 });
      }
      this.agents.get(agentName).count++;

      this.stats.processedRows++;
      return true;
    } catch (error) {
      this.errors.push({
        row: this.stats.totalRows + 1,
        jobName: row["Job Name"] || "Unknown",
        error: error.message,
        data: row,
      });
      this.stats.errorRows++;
      return false;
    } finally {
      this.stats.totalRows++;
    }
  }

  prepareResults() {
    // Ordenar jobs por frequência
    const sortedJobs = [...this.jobs.entries()].sort(
      (a, b) => b[1].count - a[1].count
    );

    // Ordenar agents por frequência
    const sortedAgents = [...this.agents.entries()].sort(
      (a, b) => b[1].count - a[1].count
    );

    return {
      jobNames: sortedJobs.map(([name]) => name),
      jobFrequencies: sortedJobs.map(([_, data]) => data.count),
      agentNames: sortedAgents.map(([name]) => name),
      agentFrequencies: sortedAgents.map(([_, data]) => data.count),
      averageDurations: sortedJobs.map(
        ([_, data]) => data.totalDuration / data.count
      ),
      statistics: {
        totalRows: this.stats.totalRows,
        processedRows: this.stats.processedRows,
        errorRows: this.stats.errorRows,
        successRate: (
          (this.stats.processedRows / this.stats.totalRows) *
          100
        ).toFixed(2),
      },
      errors: this.errors,
    };
  }
}

export async function processData(file) {
  const processor = new DataProcessor();

  if (file.name.endsWith(".csv")) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          results.data.forEach((row) => processor.processRow(row));
          resolve(processor.prepareResults());
        },
        error: reject,
      });
    });
  } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
    const data = await readExcelFile(file);
    data.forEach((row) => processor.processRow(row));
    return processor.prepareResults();
  } else {
    throw new Error("Formato de arquivo não suportado");
  }
}

async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function isValidFileType(file) {
  return file.name.match(/\.(csv|xlsx|xls)$/i);
}
