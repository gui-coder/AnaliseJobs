// chartRenderer.js

class ChartConfig {
  static get COLORS() {
    return {
      primary: "rgba(54, 162, 235, 0.8)",
      secondary: "rgba(255, 99, 132, 0.8)",
      tertiary: "rgba(75, 192, 192, 0.8)",
      quaternary: "rgba(153, 102, 255, 0.8)",
      background: "rgba(255, 255, 255, 0.8)",
    };
  }

  static get COMMON_OPTIONS() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            padding: 20,
            font: {
              size: 12,
              family: "'Arial', sans-serif",
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: {
            size: 14,
            family: "'Arial', sans-serif",
          },
          bodyFont: {
            size: 13,
            family: "'Arial', sans-serif",
          },
          padding: 12,
          cornerRadius: 4,
        },
      },
    };
  }

  static get AXIS_OPTIONS() {
    return {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    };
  }
}

class ChartHelper {
  static formatDuration(minutes) {
    if (!minutes || isNaN(minutes)) return "N/A";

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  }

  static getTop20(items, values) {
    return items
      .map((item, index) => ({
        name: item,
        value: values[index],
        shortName: item.length > 25 ? `${item.substring(0, 22)}...` : item,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }

  static clearCharts() {
    Chart.helpers.each(Chart.instances, (chart) => chart.destroy());
  }
}

class ChartCreator {
  static createJobFrequencyChart(ctx, data) {
    const top20 = ChartHelper.getTop20(data.jobNames, data.jobFrequencies);

    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: top20.map((item) => item.shortName),
        datasets: [
          {
            label: "Frequência de Jobs",
            data: top20.map((item) => item.value),
            backgroundColor: ChartConfig.COLORS.primary,
            borderColor: ChartConfig.COLORS.primary,
            borderWidth: 1,
          },
        ],
      },
      options: {
        ...ChartConfig.COMMON_OPTIONS,
        scales: ChartConfig.AXIS_OPTIONS,
        plugins: {
          ...ChartConfig.COMMON_OPTIONS.plugins,
          title: {
            display: true,
            text: "Top 20 - Jobs Mais Frequentes",
            font: { size: 16, weight: "bold" },
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => {
                const index = tooltipItems[0].dataIndex;
                return top20[index].name;
              },
            },
          },
        },
      },
    });
  }

  static createAgentFrequencyChart(ctx, data) {
    const top20 = ChartHelper.getTop20(data.agentNames, data.agentFrequencies);

    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: top20.map((item) => item.shortName),
        datasets: [
          {
            label: "Frequência de Agentes",
            data: top20.map((item) => item.value),
            backgroundColor: ChartConfig.COLORS.secondary,
            borderColor: ChartConfig.COLORS.secondary,
            borderWidth: 1,
          },
        ],
      },
      options: {
        ...ChartConfig.COMMON_OPTIONS,
        scales: ChartConfig.AXIS_OPTIONS,
        plugins: {
          ...ChartConfig.COMMON_OPTIONS.plugins,
          title: {
            display: true,
            text: "Top 20 - Agentes Mais Ativos",
            font: { size: 16, weight: "bold" },
          },
        },
      },
    });
  }

  static createDurationChart(ctx, data) {
    const top20 = ChartHelper.getTop20(data.jobNames, data.jobFrequencies);
    const durations = top20.map((item) => {
      const index = data.jobNames.indexOf(item.name);
      return data.averageDurations[index];
    });

    return new Chart(ctx, {
      type: "line",
      data: {
        labels: top20.map((item) => item.shortName),
        datasets: [
          {
            label: "Duração Média",
            data: durations,
            borderColor: ChartConfig.COLORS.tertiary,
            backgroundColor: ChartConfig.COLORS.tertiary,
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        ...ChartConfig.COMMON_OPTIONS,
        scales: {
          ...ChartConfig.AXIS_OPTIONS,
          y: {
            ...ChartConfig.AXIS_OPTIONS.y,
            ticks: {
              callback: (value) => ChartHelper.formatDuration(value),
            },
          },
        },
        plugins: {
          ...ChartConfig.COMMON_OPTIONS.plugins,
          title: {
            display: true,
            text: "Duração Média dos Top 20 Jobs",
            font: { size: 16, weight: "bold" },
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `Duração: ${ChartHelper.formatDuration(context.raw)}`,
            },
          },
        },
      },
    });
  }

  static createComparisonChart(ctx, data) {
    const top20 = ChartHelper.getTop20(data.jobNames, data.jobFrequencies);
    const durations = top20.map((item) => {
      const index = data.jobNames.indexOf(item.name);
      return data.averageDurations[index];
    });

    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: top20.map((item) => item.shortName),
        datasets: [
          {
            label: "Frequência",
            data: top20.map((item) => item.value),
            backgroundColor: ChartConfig.COLORS.primary,
            borderColor: ChartConfig.COLORS.primary,
            borderWidth: 1,
            yAxisID: "y",
          },
          {
            label: "Duração Média (min)",
            data: durations,
            backgroundColor: ChartConfig.COLORS.quaternary,
            borderColor: ChartConfig.COLORS.quaternary,
            borderWidth: 1,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        ...ChartConfig.COMMON_OPTIONS,
        scales: {
          x: ChartConfig.AXIS_OPTIONS.x,
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: { display: true, text: "Frequência" },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: { display: true, text: "Duração (min)" },
            grid: { drawOnChartArea: false },
          },
        },
        plugins: {
          ...ChartConfig.COMMON_OPTIONS.plugins,
          title: {
            display: true,
            text: "Comparação: Frequência vs Duração",
            font: { size: 16, weight: "bold" },
          },
        },
      },
    });
  }
}

export function renderCharts(data) {
  try {
    ChartHelper.clearCharts();

    const charts = [
      {
        id: "jobFrequencyChart",
        create: ChartCreator.createJobFrequencyChart,
      },
      {
        id: "agentFrequencyChart",
        create: ChartCreator.createAgentFrequencyChart,
      },
      {
        id: "durationLineChart",
        create: ChartCreator.createDurationChart,
      },
      {
        id: "comparisonStackedBarChart",
        create: ChartCreator.createComparisonChart,
      },
    ];

    charts.forEach((chart) => {
      const canvas = document.getElementById(chart.id);
      if (canvas) {
        chart.create(canvas, data);
      } else {
        console.warn(`Canvas não encontrado: ${chart.id}`);
      }
    });
  } catch (error) {
    console.error("Erro ao renderizar gráficos:", error);
    throw error;
  }
}
