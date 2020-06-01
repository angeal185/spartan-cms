import '/modules/apex/apexcharts.mjs';

let apex = {
  init: function(dest, cnf){
    let apex_chart = new ApexCharts(dest, cnf);
    apex_chart.render();
  },
  return_donut: function(obj){
    let cnf = {
      title: {
        text: obj.text,
        align: 'left',
        margin: 10,
        floating: false,
        style: {
          fontSize:  '14px',
          fontWeight:  'bold',
          fontFamily:  'oxygen',
          color:  '#263238'
        }
      },
      series: obj.series,
      labels: obj.labels,
      chart: {
        type: 'donut',
        height: 350
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function(val) {
            return [val, obj.formatter].join(' ');
          }
        }
      }
    };

    apex.init(obj.dest, cnf);
  },
  return_bar_a: function(obj){
    let cnf = {
      title: {
        text: obj.text,
        align: 'left',
        margin: 10,
        floating: false,
        style: {
          fontSize:  '14px',
          fontWeight:  'bold',
          fontFamily:  'oxygen',
          color:  '#263238'
        }
      },
      series: obj.series,
      chart: {
        type: 'bar',
        height: 350
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: obj.categories,
      },
      yaxis: {
        title: {
          text: obj.y_text
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function(val) {
            return [val, obj.formatter].join(' ');
          }
        }
      }
    };

    apex.init(obj.dest, cnf);
  },
  return_bar_b: function(obj){
    let cnf = {
        title: {
          text: obj.text,
          align: 'left',
          margin: 10,
          floating: false,
          style: {
            fontSize:  '14px',
            fontWeight:  'bold',
            fontFamily:  'oxygen',
            color:  '#263238'
          }
        },
        series: obj.series,
        chart: {
          type: 'bar',
          height: 350
        },
        plotOptions: {
          bar: {
            horizontal: true,
            endingShape: 'rounded',
            dataLabels: {
              position: 'top'
            }
          }
        },
        dataLabels: {
          enabled: true,
          offsetX: -6,
          style: {
            fontSize: '12px',
            colors: ['#fff']
          }
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: obj.categories
        },
        tooltip: {
          y: {
            formatter: function(val) {
              return [val, obj.formatter].join(' ');
            }
          }
        }
      };

    apex.init(obj.dest, cnf);
  }
}
export { apex }
