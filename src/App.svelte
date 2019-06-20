<script>
  import { fly } from 'svelte/transition';
  let bxx=0;
  let by=0;
  let show=false;
  setTimeout(()=>{show=true}, 1000)
  $: bx= -1*bxx
</script>

<style>
  .b{
    height:100%;
    width:100%;
    background-repeat: repeat-x;
    background-size: contain;
    position: fixed;
    left:0;
    top:0
  }
	#b8{
    background-image: url('img/layer_08_1920 x 1080.png')
  }
	#b7{
    background-image: url('img/layer_07_1920 x 1080.png');
    background-repeat: no-repeat;

  }
	#b6{
    background-image: url('img/layer_06_1920 x 1080.png')
  }
	#b5{
    background-image: url('img/layer_05_1920 x 1080.png')
  }
	#b4{
    background-image: url('img/layer_04_1920 x 1080.png')
  }
	#b3{
    background-image: url('img/layer_03_1920 x 1080.png')
  }
	#b2{
    background-image: url('img/layer_02_1920 x 1080.png')
  }
	#b1{
    background-image: url('img/layer_01_1920 x 1080.png')
  }
</style>
<svelte:window bind:scrollX={bxx}  bind:scrollY={by}/>
{#if show}
  <div style="height: calc(100vh + 100px); width:99000px"></div>
  <div id="b8" class="b" style="background-position-x:0px" 
  in:fly="{{delay: 50, duration: 1300, y: 700, opacity: 0.5}}">
  </div>
  <div id="b7" class="b" style="background-position-x:{bx/500}px; background-position-y:{by/20}px"
  in:fly="{{delay: 250, duration: 1300, y: 700, opacity: 0.5}}">
  </div>
  <div id="b6" class="b" style="background-position-x:{bx/32}px; background-position-y:{by/10}px"
  in:fly="{{delay: 450, duration: 1300, y: 700, opacity: 0.5}}">
  </div>
  <div id="b5" class="b" style="background-position-x:{bx/16}px; background-position-y:{by/8}px"
  in:fly="{{delay: 650, duration: 1300, y: 700, opacity: 0.5}}">
  </div>
  <div id="b4" class="b" style="background-position-x:{bx/8}px; background-position-y:{by/6}px"
  in:fly="{{delay: 850, duration: 1300, y: 700, opacity: 0.5}}">
  </div>
  <div id="b3" class="b" style="background-position-x:{bx/4}px; background-position-y:{by/4}px"
  in:fly="{{delay: 1050, duration: 1300, y: 700, opacity: 0.5}}">
  </div>
  <div id="b2" class="b" style="background-position-x:{bx/2}px; background-position-y:{by/2}px"
  in:fly="{{delay: 1250, duration: 1300, y: 700, opacity: 0.5}}">
  </div>
  <div id="b1" class="b" style="background-position-x:{bx}px; background-position-y:{by}px"
  in:fly="{{delay: 1450, duration: 1300, y: 700, opacity: 0.5}}">
  </div>
{/if}