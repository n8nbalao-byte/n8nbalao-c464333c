import { useEffect, useState } from 'react';
import { api, HardwareCategory } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

// All hardware data from StudioPC
const testHardwareData: Record<HardwareCategory, Array<{ name: string; brand: string; model: string; price: number; specs: Record<string, string>; image: string; socket?: string; memoryType?: string }>> = {
  processor: [
    { name: "Processador Intel Core I3-12100F", brand: "Intel", model: "i3-12100F", price: 733, specs: { "Núcleos": "4", "Threads": "8", "Frequência": "3.3GHz", "Turbo": "4.3GHz", "Socket": "LGA1700" }, image: "https://cdn.dooca.store/1841/products/i3-12100f_620x620+fill_ffffff+crop_center.jpg?v=1658776915", socket: "LGA1700" },
    { name: "Processador Intel Core I3-13100F", brand: "Intel", model: "i3-13100F", price: 896, specs: { "Núcleos": "4", "Threads": "8", "Frequência": "3.4GHz", "Turbo": "4.5GHz", "Socket": "LGA1700" }, image: "https://cdn.dooca.store/1841/products/i3-13100f_620x620+fill_ffffff+crop_center.jpg?v=1720017941", socket: "LGA1700" },
    { name: "Processador AMD Ryzen 5 5600", brand: "AMD", model: "Ryzen 5 5600", price: 1099, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "3.5GHz", "Turbo": "4.4GHz", "Socket": "AM4" }, image: "https://cdn.dooca.store/1841/products/2ff90unt6c38wer93hko1hwlejro95h1awto_620x620+fill_ffffff+crop_center.png?v=1716837004", socket: "AM4" },
    { name: "Processador AMD Ryzen 5 5600X", brand: "AMD", model: "Ryzen 5 5600X", price: 1259, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "3.7GHz", "Turbo": "4.6GHz", "Socket": "AM4" }, image: "https://cdn.dooca.store/1841/products/suyugtyjpmyeohwcmw66gowyhfm2jx6qmoaq_620x620+fill_ffffff+crop_center.png?v=1663262182", socket: "AM4" },
    { name: "Processador AMD Ryzen 5 8400F", brand: "AMD", model: "Ryzen 5 8400F", price: 1398, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "4.2GHz", "Turbo": "4.7GHz", "Socket": "AM5" }, image: "https://cdn.dooca.store/1841/products/ryzen-5-8000f_620x620+fill_ffffff+crop_center.jpg?v=1716410996", socket: "AM5" },
    { name: "Processador AMD Ryzen 5 8500G", brand: "AMD", model: "Ryzen 5 8500G", price: 1461, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "3.5GHz", "Turbo": "5.0GHz", "Socket": "AM5", "GPU": "Radeon 740M" }, image: "https://cdn.dooca.store/1841/products/mgmlwhbh6fc1l7ipcvj1qqonqitigdc9epyg_620x620+fill_ffffff+crop_center.png?v=1712158984", socket: "AM5" },
    { name: "Processador AMD Ryzen 5 8600G", brand: "AMD", model: "Ryzen 5 8600G", price: 1870, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "4.3GHz", "Turbo": "5.0GHz", "Socket": "AM5", "GPU": "Radeon 760M" }, image: "https://cdn.dooca.store/1841/products/amd-ryzen-8600g-site_620x620+fill_ffffff+crop_center.png?v=1711572188", socket: "AM5" },
    { name: "Processador AMD Ryzen 7 8700F", brand: "AMD", model: "Ryzen 7 8700F", price: 2299, specs: { "Núcleos": "6", "Threads": "16", "Frequência": "4.1GHz", "Turbo": "5.0GHz", "Socket": "AM5" }, image: "https://cdn.dooca.store/1841/products/ryzen-7-8000f_620x620+fill_ffffff+crop_center.jpg?v=1716411636", socket: "AM5" },
    { name: "Processador AMD Ryzen 7 8700G", brand: "AMD", model: "Ryzen 7 8700G", price: 2593, specs: { "Núcleos": "8", "Threads": "16", "Frequência": "4.2GHz", "Turbo": "5.1GHz", "Socket": "AM5", "GPU": "Radeon 780M" }, image: "https://cdn.dooca.store/1841/products/amd-ryzen-8700g-site_620x620+fill_ffffff+crop_center.png?v=1711652127", socket: "AM5" },
    { name: "Processador AMD Ryzen 9 7900X3D", brand: "AMD", model: "Ryzen 9 7900X3D", price: 5757, specs: { "Núcleos": "12", "Threads": "24", "Turbo": "5.6GHz", "Socket": "AM5", "Cache": "140MB" }, image: "https://cdn.dooca.store/1841/products/ryzen-9-3d-2_620x620+fill_ffffff+crop_center.jpg?v=1707342210", socket: "AM5" },
    { name: "Processador AMD Ryzen 9 7950X", brand: "AMD", model: "Ryzen 9 7950X", price: 5757, specs: { "Núcleos": "16", "Threads": "32", "Frequência": "4.5GHz", "Turbo": "5.7GHz", "Socket": "AM5" }, image: "https://cdn.dooca.store/1841/products/jboczfsd0cx0kv4awxp7fboft4eskorqp8nf_620x620+fill_ffffff+crop_center.jpg?v=1664569468", socket: "AM5" },
    { name: "Processador Intel Core i5-12400F", brand: "Intel", model: "i5-12400F", price: 1199, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "2.5GHz", "Turbo": "4.4GHz", "Socket": "LGA1700" }, image: "https://cdn.dooca.store/1841/products/i5-12400f_620x620+fill_ffffff+crop_center.jpg?v=1658776915", socket: "LGA1700" },
    { name: "Processador Intel Core i5-13400F", brand: "Intel", model: "i5-13400F", price: 1499, specs: { "Núcleos": "10", "Threads": "16", "Frequência": "2.5GHz", "Turbo": "4.6GHz", "Socket": "LGA1700" }, image: "https://cdn.dooca.store/1841/products/i5-13400f_620x620+fill_ffffff+crop_center.jpg?v=1720017941", socket: "LGA1700" },
    { name: "Processador Intel Core i7-13700F", brand: "Intel", model: "i7-13700F", price: 2499, specs: { "Núcleos": "16", "Threads": "24", "Frequência": "2.1GHz", "Turbo": "5.2GHz", "Socket": "LGA1700" }, image: "https://cdn.dooca.store/1841/products/i7-13700f_620x620+fill_ffffff+crop_center.jpg?v=1720017941", socket: "LGA1700" },
  ],
  motherboard: [
    { name: "ASUS Prime A520M-K AM4", brand: "ASUS", model: "Prime A520M-K", price: 449, specs: { "Socket": "AM4", "Chipset": "A520", "RAM": "DDR4" }, image: "https://cdn.dooca.store/1841/products/a520m-k_620x620+fill_ffffff+crop_center.jpg?v=1611589897", socket: "AM4", memoryType: "DDR4" },
    { name: "ASRock B660M Pro RS LGA1700", brand: "ASRock", model: "B660M Pro RS", price: 699, specs: { "Socket": "LGA1700", "Chipset": "B660", "RAM": "DDR4" }, image: "https://cdn.dooca.store/1841/products/b660m-pro-rs_620x620+fill_ffffff+crop_center.jpg?v=1649087447", socket: "LGA1700", memoryType: "DDR4" },
    { name: "Gigabyte B550 Aorus Pro V2", brand: "Gigabyte", model: "B550 Aorus Pro V2", price: 999, specs: { "Socket": "AM4", "Chipset": "B550", "RAM": "DDR4" }, image: "https://cdn.dooca.store/1841/products/b550-aorus-pro_620x620+fill_ffffff+crop_center.jpg?v=1611590004", socket: "AM4", memoryType: "DDR4" },
    { name: "ASUS TUF Gaming B760-Plus", brand: "ASUS", model: "TUF Gaming B760-Plus", price: 1299, specs: { "Socket": "LGA1700", "Chipset": "B760", "RAM": "DDR5" }, image: "https://cdn.dooca.store/1841/products/b760-tuf_620x620+fill_ffffff+crop_center.jpg?v=1675425785", socket: "LGA1700", memoryType: "DDR5" },
    { name: "MSI MAG B650 Tomahawk", brand: "MSI", model: "MAG B650 Tomahawk", price: 1599, specs: { "Socket": "AM5", "Chipset": "B650", "RAM": "DDR5" }, image: "https://cdn.dooca.store/1841/products/b650-tomahawk_620x620+fill_ffffff+crop_center.jpg?v=1664569557", socket: "AM5", memoryType: "DDR5" },
    { name: "Gigabyte Z790 Aorus Elite", brand: "Gigabyte", model: "Z790 Aorus Elite", price: 2499, specs: { "Socket": "LGA1700", "Chipset": "Z790", "RAM": "DDR5" }, image: "https://cdn.dooca.store/1841/products/z790-aorus-elite_620x620+fill_ffffff+crop_center.jpg?v=1664569623", socket: "LGA1700", memoryType: "DDR5" },
    { name: "ASUS ROG Strix X670E-E", brand: "ASUS", model: "ROG Strix X670E-E", price: 3499, specs: { "Socket": "AM5", "Chipset": "X670E", "RAM": "DDR5" }, image: "https://cdn.dooca.store/1841/products/x670e-e_620x620+fill_ffffff+crop_center.jpg?v=1664569715", socket: "AM5", memoryType: "DDR5" },
    { name: "Gigabyte B450M DS3H", brand: "Gigabyte", model: "B450M DS3H", price: 399, specs: { "Socket": "AM4", "Chipset": "B450", "RAM": "DDR4" }, image: "https://cdn.dooca.store/1841/products/b450m-ds3h_620x620+fill_ffffff+crop_center.jpg?v=1611589897", socket: "AM4", memoryType: "DDR4" },
    { name: "ASUS Prime H610M-E", brand: "ASUS", model: "Prime H610M-E", price: 549, specs: { "Socket": "LGA1700", "Chipset": "H610", "RAM": "DDR4" }, image: "https://cdn.dooca.store/1841/products/h610m-e_620x620+fill_ffffff+crop_center.jpg?v=1649087447", socket: "LGA1700", memoryType: "DDR4" },
  ],
  memory: [
    { name: "Memória RAM Gamer 8GB DDR4 3200MHz", brand: "Gamer", model: "DDR4 8GB 3200", price: 279, specs: { "Capacidade": "8GB", "Tipo": "DDR4", "Velocidade": "3200MHz" }, image: "https://cdn.dooca.store/1841/products/8gb-ddr4-gamer_620x620+fill_ffffff+crop_center.jpg?v=1658852099", memoryType: "DDR4" },
    { name: "Memória RAM Gamer 8GB DDR4 3200MHz RGB", brand: "Gamer", model: "DDR4 8GB RGB", price: 321, specs: { "Capacidade": "8GB", "Tipo": "DDR4", "Velocidade": "3200MHz", "RGB": "Sim" }, image: "https://cdn.dooca.store/1841/products/rgb-8gb_620x620+fill_ffffff+crop_center.jpg?v=1658784978", memoryType: "DDR4" },
    { name: "Memória RAM Gamer 16GB DDR4 3200MHz (2x8GB)", brand: "Gamer", model: "DDR4 16GB Kit", price: 557, specs: { "Capacidade": "16GB", "Tipo": "DDR4", "Velocidade": "3200MHz", "Kit": "2x8GB" }, image: "https://cdn.dooca.store/1841/products/16gb-ddr4-gamer_620x620+fill_ffffff+crop_center.jpg?v=1658852131", memoryType: "DDR4" },
    { name: "Memória RAM Gamer 16GB DDR4 3200MHz RGB (2x8GB)", brand: "Gamer", model: "DDR4 16GB RGB Kit", price: 642, specs: { "Capacidade": "16GB", "Tipo": "DDR4", "Velocidade": "3200MHz", "RGB": "Sim" }, image: "https://cdn.dooca.store/1841/products/16gb-rgb_620x620+fill_ffffff+crop_center.jpg?v=1658784941", memoryType: "DDR4" },
    { name: "Memória RAM Gamer 32GB DDR4 3200MHz (4x8GB ou 2x16GB)", brand: "Gamer", model: "DDR4 32GB Kit", price: 818, specs: { "Capacidade": "32GB", "Tipo": "DDR4", "Velocidade": "3200MHz" }, image: "https://cdn.dooca.store/1841/products/32gb-ddr4_620x620+fill_ffffff+crop_center.jpg?v=1658852149", memoryType: "DDR4" },
    { name: "Memória RAM Gamer 32GB DDR4 3200MHz RGB (4x8GB)", brand: "Gamer", model: "DDR4 32GB RGB Kit", price: 1284, specs: { "Capacidade": "32GB", "Tipo": "DDR4", "Velocidade": "3200MHz", "RGB": "Sim" }, image: "https://cdn.dooca.store/1841/products/32gb-1_620x620+fill_ffffff+crop_center.jpg?v=1658784954", memoryType: "DDR4" },
    { name: "Memória RAM Gamer 64GB DDR4 3200MHz RGB (4x16GB)", brand: "Gamer", model: "DDR4 64GB RGB Kit", price: 2568, specs: { "Capacidade": "64GB", "Tipo": "DDR4", "Velocidade": "3200MHz", "RGB": "Sim" }, image: "https://cdn.dooca.store/1841/products/32gb-2_620x620+fill_ffffff+crop_center.jpg?v=1658844575", memoryType: "DDR4" },
    { name: "Corsair Dominator Platinum RGB 64GB DDR5 5600MHz", brand: "Corsair", model: "CMT64GX5M2B5600Z40K", price: 4017, specs: { "Capacidade": "64GB", "Tipo": "DDR5", "Velocidade": "5600MHz", "CL": "40" }, image: "https://cdn.dooca.store/1841/products/memoria-rgb-16gb-corsair-dominator-platinum2_620x620+fill_ffffff+crop_center.jpg?v=1723575878", memoryType: "DDR5" },
    { name: "Kingston Fury Beast 16GB DDR5 5200MHz", brand: "Kingston", model: "KF552C40BB-16", price: 599, specs: { "Capacidade": "16GB", "Tipo": "DDR5", "Velocidade": "5200MHz" }, image: "https://cdn.dooca.store/1841/products/fury-beast-ddr5_620x620+fill_ffffff+crop_center.jpg?v=1723575878", memoryType: "DDR5" },
    { name: "Kingston Fury Beast 32GB DDR5 5600MHz (2x16GB)", brand: "Kingston", model: "KF556C40BBK2-32", price: 1199, specs: { "Capacidade": "32GB", "Tipo": "DDR5", "Velocidade": "5600MHz", "Kit": "2x16GB" }, image: "https://cdn.dooca.store/1841/products/fury-beast-ddr5-kit_620x620+fill_ffffff+crop_center.jpg?v=1723575878", memoryType: "DDR5" },
  ],
  storage: [
    { name: "SSD 120GB SATA3", brand: "Genérico", model: "SSD 120GB", price: 146, specs: { "Capacidade": "120GB", "Interface": "SATA3" }, image: "https://cdn.dooca.store/1841/products/120gb-ssd-mpc_620x620+fill_ffffff+crop_center.png?v=1606256087" },
    { name: "SSD 240GB SATA3", brand: "Genérico", model: "SSD 240GB", price: 225, specs: { "Capacidade": "240GB", "Interface": "SATA3" }, image: "https://cdn.dooca.store/1841/products/240gb-ssd-mpc_620x620+fill_ffffff+crop_center.png?v=1606256205" },
    { name: "SSD 480GB SATA3", brand: "Genérico", model: "SSD 480GB", price: 373, specs: { "Capacidade": "480GB", "Interface": "SATA3" }, image: "https://cdn.dooca.store/1841/products/480gb-ssd-mpc_620x620+fill_ffffff+crop_center.png?v=1606256266" },
    { name: "SSD 960GB SATA3", brand: "Genérico", model: "SSD 960GB", price: 770, specs: { "Capacidade": "960GB", "Interface": "SATA3" }, image: "https://cdn.dooca.store/1841/products/960gb-ssd-mpc_620x620+fill_ffffff+crop_center.png?v=1606256405" },
    { name: "SSD 2TB SATA3", brand: "Genérico", model: "SSD 2TB", price: 1026, specs: { "Capacidade": "2TB", "Interface": "SATA3" }, image: "https://cdn.dooca.store/1841/products/ssd-2tb-mpc_620x620+fill_ffffff+crop_center.jpg?v=1697486544" },
    { name: "SSD NVMe 256GB M.2", brand: "Kingston", model: "NV2 256GB", price: 199, specs: { "Capacidade": "256GB", "Interface": "NVMe M.2", "Leitura": "3500MB/s" }, image: "https://cdn.dooca.store/1841/products/nvme-256gb_620x620+fill_ffffff+crop_center.jpg?v=1697486544" },
    { name: "SSD NVMe 512GB M.2", brand: "Kingston", model: "NV2 512GB", price: 349, specs: { "Capacidade": "512GB", "Interface": "NVMe M.2", "Leitura": "3500MB/s" }, image: "https://cdn.dooca.store/1841/products/nvme-512gb_620x620+fill_ffffff+crop_center.jpg?v=1697486544" },
    { name: "SSD NVMe 1TB M.2", brand: "Kingston", model: "NV2 1TB", price: 549, specs: { "Capacidade": "1TB", "Interface": "NVMe M.2", "Leitura": "3500MB/s" }, image: "https://cdn.dooca.store/1841/products/nvme-1tb_620x620+fill_ffffff+crop_center.jpg?v=1697486544" },
    { name: "SSD NVMe 2TB M.2 Samsung 980 Pro", brand: "Samsung", model: "980 Pro 2TB", price: 1299, specs: { "Capacidade": "2TB", "Interface": "NVMe M.2", "Leitura": "7000MB/s" }, image: "https://cdn.dooca.store/1841/products/samsung-980-pro_620x620+fill_ffffff+crop_center.jpg?v=1697486544" },
  ],
  gpu: [
    { name: "Placa de Vídeo GeForce GT 730 4GB DDR3", brand: "Afox", model: "GT 730 4GB", price: 399, specs: { "VRAM": "4GB DDR3", "Bits": "128" }, image: "https://cdn.dooca.store/1841/products/gt-1030-1_620x620+fill_ffffff+crop_center.png?v=1711393619" },
    { name: "Placa de Vídeo GTX 1650 4GB ASUS TUF Gaming", brand: "ASUS", model: "TUF-GTX1650-O4GD6-P", price: 1299, specs: { "VRAM": "4GB GDDR6", "Série": "GTX 1650" }, image: "https://cdn.dooca.store/1841/products/gtx-1650-asus-tuf_620x620+fill_ffffff+crop_center.jpg?v=1658859415" },
    { name: "Placa de Vídeo RTX 3060 12GB Galax", brand: "Galax", model: "RTX 3060 EX", price: 2199, specs: { "VRAM": "12GB GDDR6", "Série": "RTX 3060" }, image: "https://cdn.dooca.store/1841/products/rtx-3060-galax_620x620+fill_ffffff+crop_center.jpg?v=1658859415" },
    { name: "Placa de Vídeo RTX 4060 8GB Gigabyte Gaming OC", brand: "Gigabyte", model: "RTX 4060 Gaming OC", price: 2599, specs: { "VRAM": "8GB GDDR6", "Série": "RTX 4060" }, image: "https://cdn.dooca.store/1841/products/rtx-4060-gigabyte_620x620+fill_ffffff+crop_center.jpg?v=1658859415" },
    { name: "Placa de Vídeo RTX 4060 Ti 8GB ASUS Dual", brand: "ASUS", model: "DUAL-RTX4060TI-O8G", price: 3299, specs: { "VRAM": "8GB GDDR6", "Série": "RTX 4060 Ti" }, image: "https://cdn.dooca.store/1841/products/rtx-4060ti-asus_620x620+fill_ffffff+crop_center.jpg?v=1658859415" },
    { name: "Placa de Vídeo RTX 4070 12GB MSI Ventus 3X", brand: "MSI", model: "RTX 4070 Ventus 3X", price: 4499, specs: { "VRAM": "12GB GDDR6X", "Série": "RTX 4070" }, image: "https://cdn.dooca.store/1841/products/rtx-4070-msi_620x620+fill_ffffff+crop_center.jpg?v=1658859415" },
    { name: "Placa de Vídeo RTX 4070 Ti Super 16GB Gigabyte", brand: "Gigabyte", model: "RTX 4070 Ti Super Gaming OC", price: 6999, specs: { "VRAM": "16GB GDDR6X", "Série": "RTX 4070 Ti Super" }, image: "https://cdn.dooca.store/1841/products/rtx-4070ti-gigabyte_620x620+fill_ffffff+crop_center.jpg?v=1658859415" },
    { name: "Placa de Vídeo RTX 4080 Super 16GB ASUS ROG Strix", brand: "ASUS", model: "ROG-STRIX-RTX4080S-O16G", price: 9999, specs: { "VRAM": "16GB GDDR6X", "Série": "RTX 4080 Super" }, image: "https://cdn.dooca.store/1841/products/rtx-4080-asus_620x620+fill_ffffff+crop_center.jpg?v=1658859415" },
    { name: "Placa de Vídeo RX 6600 8GB PowerColor", brand: "PowerColor", model: "RX 6600 Fighter", price: 1599, specs: { "VRAM": "8GB GDDR6", "Série": "RX 6600" }, image: "https://cdn.dooca.store/1841/products/rx-6600-powercolor_620x620+fill_ffffff+crop_center.jpg?v=1658859415" },
    { name: "Placa de Vídeo RX 7600 8GB Sapphire Pulse", brand: "Sapphire", model: "RX 7600 Pulse", price: 2299, specs: { "VRAM": "8GB GDDR6", "Série": "RX 7600" }, image: "https://cdn.dooca.store/1841/products/rx-7600-sapphire_620x620+fill_ffffff+crop_center.jpg?v=1658859415" },
  ],
  psu: [
    { name: "Fonte 300W PFC Ativo", brand: "Genérico", model: "300W", price: 213, specs: { "Potência": "300W", "PFC": "Ativo" }, image: "https://cdn.dooca.store/1841/products/fonte-300w-spark-pcyes_620x620+fill_ffffff+crop_center.png?v=1710874584" },
    { name: "Fonte 500W PFC Ativo", brand: "Genérico", model: "500W", price: 227, specs: { "Potência": "500W", "PFC": "Ativo" }, image: "https://cdn.dooca.store/1841/products/fonte-350w-site_620x620+fill_ffffff+crop_center.jpg?v=1645711594" },
    { name: "Fonte 500W 80 Plus", brand: "Genérico", model: "500W 80+", price: 227, specs: { "Potência": "500W", "Certificação": "80 Plus" }, image: "https://cdn.dooca.store/1841/products/vtk-450-fonte_620x620+fill_ffffff+crop_center.png?v=1651518091" },
    { name: "Fonte 600W 80 Plus Bronze", brand: "Genérico", model: "600W Bronze", price: 338, specs: { "Potência": "600W", "Certificação": "80 Plus Bronze" }, image: "https://cdn.dooca.store/1841/products/fonte-600w_620x620+fill_ffffff+crop_center.jpg?v=1618664984" },
    { name: "Fonte Gamer 750W 80 Plus Bronze", brand: "Genérico", model: "750W Bronze", price: 638, specs: { "Potência": "750W", "Certificação": "80 Plus Bronze" }, image: "https://cdn.dooca.store/1841/products/atlas-750_620x620+fill_ffffff+crop_center.jpg?v=1677855562" },
    { name: "Fonte Corsair TX650M 650W 80 Plus Gold", brand: "Corsair", model: "TX650M", price: 810, specs: { "Potência": "650W", "Certificação": "80 Plus Gold" }, image: "https://cdn.dooca.store/1841/products/corsair-tx650m-1_620x620+fill_ffffff+crop_center.jpg?v=1624627933" },
    { name: "Fonte GameMax GX800 800W 80 Plus Gold", brand: "GameMax", model: "GX800", price: 934, specs: { "Potência": "800W", "Certificação": "80 Plus Gold", "PFC": "Ativo" }, image: "https://cdn.dooca.store/1841/products/fonte-gx800_620x620+fill_ffffff+crop_center.jpg?v=1699049513" },
    { name: "Fonte GX850 PRO 850W 80 Plus Gold Full Modular ATX 3.0", brand: "GameMax", model: "GX850 PRO", price: 1127, specs: { "Potência": "850W", "Certificação": "80 Plus Gold", "Modular": "Full", "ATX": "3.0" }, image: "https://cdn.dooca.store/1841/products/gx850-bk1_620x620+fill_ffffff+crop_center.jpg?v=1699050518" },
    { name: "Fonte Corsair RM850x 850W 80 Plus Gold", brand: "Corsair", model: "RM850x", price: 1299, specs: { "Potência": "850W", "Certificação": "80 Plus Gold", "Modular": "Full" }, image: "https://cdn.dooca.store/1841/products/corsair-rm850x_620x620+fill_ffffff+crop_center.jpg?v=1699050518" },
    { name: "Fonte Corsair HX1000 1000W 80 Plus Platinum", brand: "Corsair", model: "HX1000", price: 1899, specs: { "Potência": "1000W", "Certificação": "80 Plus Platinum", "Modular": "Full" }, image: "https://cdn.dooca.store/1841/products/corsair-hx1000_620x620+fill_ffffff+crop_center.jpg?v=1699050518" },
  ],
  case: [
    { name: "Gabinete Gamer GBT X500MW C/ 3 Fans - Branco", brand: "GBT", model: "X500MW", price: 218, specs: { "Fans": "3", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/gbt-500-branco-1_620x620+fill_ffffff+crop_center.jpg?v=1738096965" },
    { name: "Gabinete Gamer Aquario CG-L4RE Curvo - Preto", brand: "Aquario", model: "CG-L4RE", price: 219, specs: { "Frente": "Curvada", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/kmex-curvo-micro-preto_620x620+fill_ffffff+crop_center.jpg?v=1755025143" },
    { name: "Gabinete Gamemax Diamond ARGB C/ 1 Fan - Preto", brand: "Gamemax", model: "Diamond", price: 225, specs: { "Fans": "1", "RGB": "ARGB", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/gamemax-diamond-2_620x620+fill_ffffff+crop_center.jpg?v=1705960633" },
    { name: "Gabinete Fortrek Black Hawk RGB C/ 1 Fan - Preto", brand: "Fortrek", model: "Black Hawk", price: 226, specs: { "Fans": "1", "RGB": "Sim", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/black-hawk-site_620x620+fill_ffffff+crop_center.png?v=1644439629" },
    { name: "Gabinete Gamer Aquario Space CG-P2R4 ATX - Preto", brand: "Aquario", model: "Space CG-P2R4", price: 260, specs: { "Formato": "ATX", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/kmex-aquario-grande-1-preto_620x620+fill_ffffff+crop_center.jpg?v=1725977709" },
    { name: "Gabinete Forcefield TWR Black Vulcan PCYES - Preto", brand: "PCYES", model: "Forcefield TWR", price: 298, specs: { "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/forcefield-twr-preto-1_620x620+fill_ffffff+crop_center.jpg?v=1726248032" },
    { name: "Gabinete T-Dagger Cube Black - Preto", brand: "T-Dagger", model: "Cube Black", price: 398, specs: { "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/cube-blacksite_620x620+fill_ffffff+crop_center.jpg?v=1656536621" },
    { name: "Gabinete Cougar MX440 MESH RGB C/ 3 FANS - Preto", brand: "Cougar", model: "MX440 MESH RGB", price: 466, specs: { "Formato": "Mid-Tower", "Fans": "3", "RGB": "Sim", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/cougar-mx440-mesh-rgb-preto-01-studiopc_620x620+fill_ffffff+crop_center.jpg?v=1686264099" },
    { name: "Gabinete Liketec Madness Vidro Curvo - Preto", brand: "Liketec", model: "Madness", price: 499, specs: { "Vidro": "Curvo", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/5n1n6pdjct9aeqdkq18vefgokq39vehczraq_620x620+fill_ffffff+crop_center.jpg?v=1730388962" },
    { name: "Gabinete DeepCool CH560 WH ARGB C/ 4 Fans - Branco", brand: "DeepCool", model: "CH560 WH", price: 549, specs: { "Fans": "4", "RGB": "ARGB", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/ch560-branco-1_620x620+fill_ffffff+crop_center.jpg?v=1706029894" },
    { name: "Gabinete Cougar MX430 Air RGB C/ 3 Fans - Branco", brand: "Cougar", model: "MX430 Air RGB", price: 559, specs: { "Fans": "3", "RGB": "Sim", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/mx-430-air-white-1_620x620+fill_ffffff+crop_center.jpg?v=1660233337" },
    { name: "Gabinete Gamdias Atlas M1 Display C/ 3 Fans - Preto", brand: "Gamdias", model: "Atlas M1", price: 561, specs: { "Display": "Sim", "Fans": "3", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/gamdias-m1-1_620x620+fill_ffffff+crop_center.jpg?v=1743861352" },
    { name: "Gabinete NZXT H5 Flow - Branco", brand: "NZXT", model: "H5 Flow", price: 799, specs: { "Formato": "Mid-Tower", "Cor": "Branco", "Airflow": "High" }, image: "https://cdn.dooca.store/1841/products/nzxt-h5-flow-branco_620x620+fill_ffffff+crop_center.jpg?v=1743861352" },
    { name: "Gabinete Lian Li O11 Dynamic EVO - Preto", brand: "Lian Li", model: "O11 Dynamic EVO", price: 1299, specs: { "Formato": "Mid-Tower", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/lian-li-o11-evo_620x620+fill_ffffff+crop_center.jpg?v=1743861352" },
  ],
  cooler: [
    { name: "Water Cooler LE300 Rainbow 120mm Deepcool - Preto", brand: "Deepcool", model: "LE300", price: 278, specs: { "Tipo": "AIO 120mm", "RGB": "Rainbow" }, image: "https://cdn.dooca.store/1841/products/deepcool-le300-site-120mm_620x620+fill_ffffff+crop_center.jpg?v=1701459060" },
    { name: "Water Cooler 240mm ARGB - Branco", brand: "Gamdias", model: "Aura GL240 V2", price: 356, specs: { "Tipo": "AIO 240mm", "RGB": "ARGB", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/gamdias-aura-gl-240-v2-wc-240-site-2_620x620+fill_ffffff+crop_center.jpg?v=1717701586" },
    { name: "Water Cooler 240mm ARGB - Preto", brand: "Gamdias", model: "Aura GL240 V2", price: 356, specs: { "Tipo": "AIO 240mm", "RGB": "ARGB", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/gamdias-aura-240mm-preto-2_620x620+fill_ffffff+crop_center.jpg?v=1722865291" },
    { name: "Water Cooler Spectra ARGB 240mm Onepower", brand: "Onepower", model: "Spectra WC-501", price: 368, specs: { "Tipo": "AIO 240mm", "RGB": "ARGB" }, image: "https://cdn.dooca.store/1841/products/water-240-one-power_620x620+fill_ffffff+crop_center.jpg?v=1700770925" },
    { name: "Water Cooler Spectra ARGB 360mm Onepower", brand: "Onepower", model: "Spectra WC-502", price: 438, specs: { "Tipo": "AIO 360mm", "RGB": "ARGB" }, image: "https://cdn.dooca.store/1841/products/water-360-one-power_620x620+fill_ffffff+crop_center.jpg?v=1700771538" },
    { name: "Water Cooler LE500 Rainbow 240mm Deepcool - Preto", brand: "Deepcool", model: "LE500", price: 457, specs: { "Tipo": "AIO 240mm", "RGB": "Rainbow" }, image: "https://cdn.dooca.store/1841/products/le-500-wc-1-2_620x620+fill_ffffff+crop_center.jpg?v=1667312980" },
    { name: "Water Cooler Aura GL360 V2 ARGB 360mm - Branco", brand: "Gamdias", model: "Aura GL360 V2", price: 520, specs: { "Tipo": "AIO 360mm", "RGB": "ARGB", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/water-aura-360-branco_620x620+fill_ffffff+crop_center.jpg?v=1751724214" },
    { name: "Water Cooler LT520 RGB 240mm Deepcool - Branco", brand: "Deepcool", model: "LT520 WH", price: 868, specs: { "Tipo": "AIO 240mm", "RGB": "Sim", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/gls9ym6wxa8xpzooph5htxdhh4lnbip1d2yt_620x620+fill_ffffff+crop_center.jpg?v=1694614011" },
    { name: "Water Cooler LT520 RGB 240mm Deepcool - Preto", brand: "Deepcool", model: "LT520", price: 868, specs: { "Tipo": "AIO 240mm", "RGB": "Sim", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/watercooler-lt520-240mm-1_620x620+fill_ffffff+crop_center.jpg?v=1673986878" },
    { name: "Water Cooler Lian Li GALAHAD II TRINITY RGB 240mm", brand: "Lian Li", model: "GA2T24", price: 951, specs: { "Tipo": "AIO 240mm", "RGB": "Sim" }, image: "https://cdn.dooca.store/1841/products/lian-li-galahad-trinity-2-preto3_620x620+fill_ffffff+crop_center.jpg?v=1698267044" },
    { name: "Cooler Master Hyper 212 Black Edition", brand: "Cooler Master", model: "Hyper 212 BE", price: 249, specs: { "Tipo": "Air Cooler", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/hyper-212-black_620x620+fill_ffffff+crop_center.jpg?v=1698267044" },
    { name: "DeepCool AK620 Digital - Preto", brand: "DeepCool", model: "AK620", price: 599, specs: { "Tipo": "Air Cooler Tower", "Display": "Digital", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/ak620-digital_620x620+fill_ffffff+crop_center.jpg?v=1698267044" },
    { name: "Noctua NH-D15 Chromax Black", brand: "Noctua", model: "NH-D15", price: 899, specs: { "Tipo": "Air Cooler Tower", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/noctua-nh-d15_620x620+fill_ffffff+crop_center.jpg?v=1698267044" },
  ],
};

export default function ImportHardware() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<Record<string, { total: number; done: number; status: string }>>({});
  const [done, setDone] = useState(false);

  const importAll = async () => {
    setImporting(true);
    setDone(false);

    const categories = Object.keys(testHardwareData) as HardwareCategory[];
    
    for (const category of categories) {
      const items = testHardwareData[category];
      setProgress(prev => ({
        ...prev,
        [category]: { total: items.length, done: 0, status: 'Importando...' }
      }));

      let successCount = 0;
      for (const item of items) {
        try {
          await api.createHardware({
            ...item,
            category,
          });
          successCount++;
          setProgress(prev => ({
            ...prev,
            [category]: { total: items.length, done: successCount, status: 'Importando...' }
          }));
        } catch (error) {
          console.error(`Error importing ${item.name}:`, error);
        }
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setProgress(prev => ({
        ...prev,
        [category]: { total: items.length, done: successCount, status: 'Concluído!' }
      }));
    }

    setImporting(false);
    setDone(true);
    toast({
      title: "Importação concluída!",
      description: "Todos os produtos do StudioPC foram importados com sucesso.",
    });
  };

  const categoryLabels: Record<HardwareCategory, string> = {
    processor: 'Processadores',
    motherboard: 'Placas Mãe',
    memory: 'Memórias RAM',
    storage: 'Armazenamento',
    gpu: 'Placas de Vídeo',
    psu: 'Fontes',
    case: 'Gabinetes',
    cooler: 'Coolers',
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Importar Hardware do StudioPC</h1>
        
        <div className="bg-card rounded-lg p-6 border border-border mb-6">
          <p className="text-muted-foreground mb-4">
            Esta página irá importar todos os produtos de hardware do StudioPC diretamente para o seu banco de dados.
          </p>
          
          <ul className="text-sm text-muted-foreground mb-6 space-y-1">
            {(Object.keys(testHardwareData) as HardwareCategory[]).map(cat => (
              <li key={cat}>• {categoryLabels[cat]}: {testHardwareData[cat].length} itens</li>
            ))}
          </ul>

          <Button 
            onClick={importAll} 
            disabled={importing || done}
            className="w-full"
            size="lg"
          >
            {importing ? 'Importando...' : done ? 'Importação Concluída!' : 'Iniciar Importação'}
          </Button>
        </div>

        {Object.keys(progress).length > 0 && (
          <div className="space-y-3">
            {(Object.entries(progress) as [HardwareCategory, { total: number; done: number; status: string }][]).map(([cat, p]) => (
              <div key={cat} className="bg-card rounded-lg p-4 border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-foreground">{categoryLabels[cat]}</span>
                  <span className="text-sm text-muted-foreground">{p.done}/{p.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(p.done / p.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-1">{p.status}</span>
              </div>
            ))}
          </div>
        )}

        {done && (
          <div className="mt-6 text-center">
            <p className="text-green-500 font-medium mb-4">✓ Todos os produtos foram importados!</p>
            <Button variant="outline" onClick={() => window.location.href = '/monte-voce-mesmo'}>
              Ver página Monte Você Mesmo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
