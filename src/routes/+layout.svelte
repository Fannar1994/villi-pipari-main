<script>
  import '../app.css';
</script>

<style>
  :global(body) {
    background-color: #2d2d2d;
    color: #ffffff;
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }

  :global(.app-container) {
    background-color: #2d2d2d;
    min-height: 100vh;
    padding: 2rem;
  }

  :global(input), 
  :global(select), 
  :global(button) {
    background-color: #3d3d3d;
    color: #ffffff;
    border: 1px solid #4d4d4d;
    padding: 0.5rem;
    border-radius: 4px;
  }

  :global(button:hover) {
    background-color: #4d4d4d;
  }

  :global(.card) {
    background-color: #3d3d3d;
    border: 1px solid #4d4d4d;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
</style>

<div class="app-container">
  <slot />
</div>  