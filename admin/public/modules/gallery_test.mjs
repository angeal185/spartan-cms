import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import '/modules/apex/apexcharts.mjs';

var init = function(){

  window.addEventListener("gallery_list", function(evt) {
    evt = evt.detail;
    let link_test,
    test_status = h('h5.text-right.mr-2', 'Ready...'),
    test_output = h('textarea.form-control',{
      rows: 10
    }),
    test_index = 0,
    test_length = evt.length,
    test_img = h('img.img-fluid', {
      width: 250,
      onload: function(){
        link_test.passed.push(evt[test_index]);
        test_output.append(evt[test_index].title +' load success\n')
        if(test_index === (test_length -1)){
          let t_pass = link_test.passed.length,
          t_fail = link_test.failed.length;
          test_output.append(
            'test completed with '+ t_pass +' passed and '+ t_fail +' failed images\n'
          );
          test_status.innerText = 'Complete';
          test_index = 0;
          fail_graph(f_graph_div, [t_pass, t_fail])
        } else {
          test_index++
          test_status.innerText = 'Testing '+ (test_index + 1) +'/' + evt.length +' images';
          test_img.src = evt[test_index].url;
        }
      },
      onerror: function(){
        link_test.failed.push(evt[test_index])
        test_output.append(evt[test_index].title +' load failed\n');
        gal_failed_count.innerText = link_test.failed.length;
        gal_failed.append(h('div.list-group-item',
          h('div.row',
            h('div.col-8', h('p', evt[test_index].title)),
            h('div.col-4', h('p.text-right',
              utils.ts2datetime(evt[test_index].date))
            ),
            h('div.col-8', h('a',{
              href: evt[test_index].url,
              target: '_blank'
            }, evt[test_index].url)),
            h('div.col-4',
              h('span.float-right',
                h('button.btn.btn-sm.btn-outline-danger', {
                  type: 'button',
                  onclick: function(){
                    ws.send({
                      type: 'gallery_del',
                      data: evt[test_index].date
                    })
                  }
                }, 'Delete')
              )
            )
          )
        ))

        if(test_index === (test_length -1)){
          let t_pass = link_test.passed.length,
          t_fail = link_test.failed.length;

          test_output.append(
            'test completed with '+ t_pass +' passed and '+ t_fail +' failed images\n'
          );
          test_status.innerText = 'Complete';
          test_index = 0;
          fail_graph(f_graph_div, [t_pass, t_fail]);
        } else {
          test_index++
          test_status.innerText = 'Testing '+ (test_index + 1) +'/' + evt.length +' images';
          test_img.src = evt[test_index].url;
        }
      }
    }),
    gal_head = h('strong'),
    gal_results = h('div.row'),
    gal_failed = h('div.list-group'),
    gal_failed_count = h('span.float-right', '0'),
    f_graph_div = h('div.col-12'),
    row_main = h('div.row',
      h('div.col-10',
        gal_head
      ),
      h('div.col-2',
        h('button.btn.btn-sm.btn-outline-info.float-right', {
          type: 'button',
          onclick: function(){
            link_test = {
              passed: [],
              failed: []
            }
            utils.empty(gal_failed);
            gal_failed_count.innerText = '0';
            test_status.innerText = 'Testing 1/' + evt.length +' images';
            test_img.src = evt[test_index].url;
          }
        }, 'Start test'),
      ),
      h('div.col-12',
        h('hr')
      )
    ),f_graph;

    gal_head.innerText = [evt.length, 'gallery images found.'].join(' ');

    gal_results.append(
      h('div.col-6',
        h('h5.ml-2', 'Status')
      ),
      h('div.col-6',
        test_status
      ),
      h('div.col-6',
        h('div.form-group',
          test_output
        )
      ),
      h('div.col-6.text-center.m-a',
        test_img
      ),
      h('div.col-12',
        h('hr'),
        h('h5', 'failed images',
          gal_failed_count
        ),
        gal_failed
      ),
      h('div.col-12',
        h('hr.mt-4')
      ),
      f_graph_div
    )

    document.getElementById('main-content').append(
      h('h3', 'Gallery Test'),
      row_main,
      gal_results
    );

    function fail_graph(f_graph_div, arr){
      utils.empty(f_graph_div);

      let f_graph_options = {
          title: {
            text: 'image load stats',
            align: 'left',
            margin: 10,
            floating: false,
            style: {
              fontSize:  '18px',
              fontWeight:  'bold',
              fontFamily:  'oxygen',
              color:  '#858796'
            }
          },
          series: arr,
          labels: ['pass', 'fail'],
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
                return [val, 'images total'].join(' ');
              }
            }
          }
        };

        let f_graph = new ApexCharts(f_graph_div, f_graph_options)

        f_graph.render();
    }

  });

  ws.send({
    type: 'gallery_list'
  });

  window.removeEventListener('socket_ready', init, false);
}



window.addEventListener('socket_ready', init, false)
