<script>
    export let imgSrc = "/404.png";
	export let imgAlt = "screenshot";
	export let title = "title";
	export let text = "text";
</script>

<div class="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
    <img src="{imgSrc}" alt="{imgAlt}" class="w-full h-56 object-cover object-top">
    <div class="p-6">
        <h3 class="text-xl font-semibold mb-2">{title}</h3>
        <p class="text-gray-600 dark:text-gray-300">{text}</p>
    </div>
</div>