<script setup lang = "ts">
    import { ref } from 'vue';
    const sum = ref<number>(0);
    const num1 = ref<number>(0);
    const num2 = ref<number>(0);

    const calculateSum = () => {
    sum.value = num1.value + num2.value;
};
</script>

<template>
    <div>
        <input class="inputbox" type="number" v-model.number="num1" placeholder="Número 1" />
        <input class="inputbox" type="number" v-model.number="num2" placeholder="Número 2" />
        <p>La suma es: {{ sum }}</p>
    </div>
    <button @click="calculateSum">Calcula Suma</button>
</template>

<style scoped>
    div {
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 5px;
        max-width: 300px;
        margin: auto;
    }
    
    button {
        padding: 5px 10px;
        margin-top: 10px;
    }
</style>