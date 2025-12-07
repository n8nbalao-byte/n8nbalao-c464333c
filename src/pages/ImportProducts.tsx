import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, ProductCategory } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Check, Upload, Loader2 } from 'lucide-react';

// Produtos extraídos do RDJINFO e Kaytec
const productsData = {
  pc: [
    // RDJINFO - PCs Gamer
    {
      title: "PC Gamer Completo I7-6700 DDR4 32GB NVMe 1TB VGA 4GB",
      subtitle: "Intel Core I7 6ª Geração",
      description: "PC Gamer completo com processador Intel Core I7-6700, 32GB de memória RAM DDR4, SSD NVMe 1TB e placa de vídeo GeForce GT 730 4GB. Ideal para jogos e trabalho.",
      categories: ["pc"],
      totalPrice: 3099,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "32GB DDR4", "Armazenamento": "1TB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "CPU Gamer Intel Core I5-6500 32GB DDR4 NVMe 512GB VGA 4GB",
      subtitle: "Intel Core I5 6ª Geração",
      description: "CPU Gamer com processador Intel Core I5-6500, 32GB de memória RAM DDR4, SSD NVMe 512GB e placa de vídeo 4GB. Excelente para jogos e produtividade.",
      categories: ["pc"],
      totalPrice: 2749,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-6500", "Memória RAM": "32GB DDR4", "Armazenamento": "512GB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "CPU Gamer Intel Core I5-6500 32GB DDR4 NVMe 256GB",
      subtitle: "Intel Core I5 6ª Geração",
      description: "CPU Gamer com Intel Core I5-6500, 32GB RAM DDR4 e NVMe 256GB. Performance excelente para jogos e trabalho.",
      categories: ["pc"],
      totalPrice: 2499,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-6500", "Memória RAM": "32GB DDR4", "Armazenamento": "256GB NVMe", "Placa de Vídeo": "Intel HD Graphics 530", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Computador Intel I7-6700 8GB NVMe 256GB Vídeo 4GB",
      subtitle: "Intel Core I7 6ª Geração",
      description: "Computador com Intel I7-6700, 8GB RAM, SSD NVMe 256GB e placa de vídeo GeForce GT 730 4GB.",
      categories: ["pc"],
      totalPrice: 2399,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "8GB DDR4", "Armazenamento": "256GB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "CPU Computador Intel I5 16GB NVMe 512GB Placa Vídeo 4GB",
      subtitle: "Intel Core I5 6ª Geração",
      description: "Computador Intel I5 com 16GB de RAM, SSD NVMe 512GB e placa de vídeo 4GB. Ótimo para escritório e jogos leves.",
      categories: ["pc"],
      totalPrice: 2099,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-6500", "Memória RAM": "16GB DDR4", "Armazenamento": "512GB NVMe", "Placa de Vídeo": "Intel HD Graphics 530", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Gamer CPU I7 Memória 16GB 1TB NVMe GT 730 4GB 500W",
      subtitle: "Intel Core I7 6ª Geração",
      description: "PC Gamer com processador I7, 16GB de memória, 1TB NVMe e placa de vídeo GT 730 4GB com fonte de 500W.",
      categories: ["pc"],
      totalPrice: 2699,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "16GB DDR4", "Armazenamento": "1TB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Computador Gamer I5-12400F 32GB RAM NVMe 1TB VGA 4GB",
      subtitle: "Intel Core I5 12ª Geração",
      description: "Computador Gamer com Intel I5-12400F de última geração, 32GB RAM, 1TB NVMe e placa de vídeo GT 730 4GB.",
      categories: ["pc"],
      totalPrice: 3649,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-12400F", "Memória RAM": "32GB DDR4", "Armazenamento": "1TB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "CPU PC Computador Gamer I5-10400F 16GB NVMe 512GB VGA 4GB",
      subtitle: "Intel Core I5 10ª Geração",
      description: "PC Gamer com Intel I5-10400F, 16GB RAM, SSD NVMe 512GB e placa de vídeo GeForce GT 730 4GB.",
      categories: ["pc"],
      totalPrice: 3190,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-10400F", "Memória RAM": "16GB DDR4", "Armazenamento": "512GB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Gamer I5-10400F 32GB DDR4 NVMe 512GB Placa Vídeo 4GB",
      subtitle: "Intel Core I5 10ª Geração",
      description: "PC Gamer de alta performance com I5-10400F, 32GB DDR4, 512GB NVMe e VGA 4GB.",
      categories: ["pc"],
      totalPrice: 3450,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-10400F", "Memória RAM": "32GB DDR4", "Armazenamento": "512GB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Gamer I5-10400F 16GB RAM NVMe 1TB Placa Video 4GB",
      subtitle: "Intel Core I5 10ª Geração",
      description: "PC Gamer com Intel I5-10400F, 16GB RAM, 1TB NVMe e placa de vídeo GeForce GT 730 4GB.",
      categories: ["pc"],
      totalPrice: 3490,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-10400F", "Memória RAM": "16GB DDR4", "Armazenamento": "1TB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "CPU PC Computador Gamer I5-10400F 32GB NVMe 1TB VGA 4GB",
      subtitle: "Intel Core I5 10ª Geração",
      description: "PC Gamer potente com I5-10400F, 32GB RAM, 1TB NVMe e GT 730 4GB.",
      categories: ["pc"],
      totalPrice: 3790,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-10400F", "Memória RAM": "32GB DDR4", "Armazenamento": "1TB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "CPU Computador I7-6700 DDR4 32GB NVMe 512GB VGA 4GB",
      subtitle: "Intel Core I7 6ª Geração Gamer",
      description: "Computador gamer com Intel I7-6700, 32GB DDR4, 512GB NVMe e placa de vídeo integrada.",
      categories: ["pc"],
      totalPrice: 2999,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "32GB DDR4", "Armazenamento": "512GB NVMe", "Placa de Vídeo": "Intel HD Graphics 530", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Gamer CPU RGB Completo I7-6700 DDR4 32GB RAM NVMe 512GB",
      subtitle: "Intel Core I7 6ª Geração RGB",
      description: "PC Gamer completo com iluminação RGB, Intel I7-6700, 32GB DDR4 e 512GB NVMe.",
      categories: ["pc"],
      totalPrice: 2999,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "32GB DDR4", "Armazenamento": "512GB NVMe", "RGB": "Sim", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "Computador PC Gamer Intel I5-10400F 8GB SSD 240GB GeForce 4GB",
      subtitle: "Intel Core I5 10ª Geração",
      description: "PC Gamer Intel I5-10400F com 8GB RAM, SSD 240GB e placa GeForce 4GB.",
      categories: ["pc"],
      totalPrice: 2699,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-10400F", "Memória RAM": "8GB DDR4", "Armazenamento": "240GB SSD", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    // RDJINFO - Linha Office
    {
      title: "Computador Intel I5-4570 Placa Mãe H81 NVMe 256GB DDR3 16GB",
      subtitle: "Intel Core I5 4ª Geração Office",
      description: "Computador para escritório com Intel I5-4570, 16GB RAM DDR3 e SSD NVMe 256GB.",
      categories: ["pc"],
      totalPrice: 1190,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-4570", "Memória RAM": "16GB DDR3", "Armazenamento": "256GB NVMe", "Placa de Vídeo": "Intel HD Graphics 4600", "Chipset": "H81" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Computador CPU Intel I5-6500 DDR4 16GB NVMe 256GB",
      subtitle: "Intel Core I5 6ª Geração Office",
      description: "PC para trabalho com Intel I5-6500, 16GB DDR4 e NVMe 256GB.",
      categories: ["pc"],
      totalPrice: 1649,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-6500", "Memória RAM": "16GB DDR4", "Armazenamento": "256GB NVMe", "Placa de Vídeo": "Intel HD Graphics 530" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "Computador CPU Intel Core I7-6700 8GB DDR4 NVMe 256GB F500W",
      subtitle: "Intel Core I7 6ª Geração Office",
      description: "Computador de alta performance para escritório com Intel I7-6700, 8GB DDR4 e 256GB NVMe.",
      categories: ["pc"],
      totalPrice: 1999,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "8GB DDR4", "Armazenamento": "256GB NVMe", "Placa de Vídeo": "Intel HD Graphics 530", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "CPU Computador I7-6700 3.4GHz 16GB RAM SSD NVMe 512GB F500W",
      subtitle: "Intel Core I7 6ª Geração Office",
      description: "Computador Office potente com Intel I7-6700 3.4GHz, 16GB RAM e 512GB NVMe.",
      categories: ["pc"],
      totalPrice: 2199,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700 3.4GHz", "Memória RAM": "16GB DDR4", "Armazenamento": "512GB NVMe", "Placa de Vídeo": "Intel HD Graphics 530", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Office CPU Completo I7-6700 DDR4 32GB NVMe 1TB VGA 4GB",
      subtitle: "Intel Core I7 6ª Geração Office Premium",
      description: "PC Office completo com Intel I7-6700, 32GB DDR4, 1TB NVMe e placa de vídeo 4GB.",
      categories: ["pc"],
      totalPrice: 2999,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "32GB DDR4", "Armazenamento": "1TB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB", "Fonte": "500W" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Office CPU Completo I7-6700 DDR4 32GB NVMe 512GB VGA 4GB",
      subtitle: "Intel Core I7 6ª Geração Office",
      description: "PC Office com Intel I7-6700, 32GB DDR4, 512GB NVMe e VGA 4GB.",
      categories: ["pc"],
      totalPrice: 2699,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "32GB DDR4", "Armazenamento": "512GB NVMe", "Placa de Vídeo": "GeForce GT 730 4GB" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "Computador PC Core Intel I7-3770 SSD 1TB 16GB RAM",
      subtitle: "Intel Core I7 3ª Geração Office",
      description: "Computador com Intel I7-3770, 16GB RAM e SSD de 1TB.",
      categories: ["pc"],
      totalPrice: 1775,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-3770", "Memória RAM": "16GB DDR3", "Armazenamento": "1TB SSD" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Computador CPU Intel I5-2400 DDR3 8GB NVMe 256GB",
      subtitle: "Intel Core I5 2ª Geração Office",
      description: "Computador econômico com Intel I5-2400, 8GB RAM DDR3 e NVMe 256GB.",
      categories: ["pc"],
      totalPrice: 949,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-2400", "Memória RAM": "8GB DDR3", "Armazenamento": "256GB NVMe", "Placa de Vídeo": "Intel HD Graphics 2000" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    // Kaytec - PCs
    {
      title: "Mini PC CPU Slim Computador Intel I5-3470 16GB RAM SSD 240GB",
      subtitle: "Intel Core I5 3ª Geração Slim",
      description: "Mini PC Slim com Intel I5-3470, 16GB RAM e SSD 240GB. Bivolt 110/220V.",
      categories: ["pc"],
      totalPrice: 1045,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_800860-MLB93711829736_102025-AB.webp" }],
      specs: { "Processador": "Intel Core I5-3470", "Memória RAM": "16GB DDR3", "Armazenamento": "240GB SSD", "Formato": "Slim", "Voltagem": "Bivolt 110/220V" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Slim Office Completo I7-6700 Intel 16GB DDR4 NVMe 512GB",
      subtitle: "Intel Core I7 6ª Geração Slim",
      description: "PC Slim Office com Intel I7-6700, 16GB DDR4 e NVMe 512GB.",
      categories: ["pc"],
      totalPrice: 2175,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_676766-MLB90059027759_082025-AB.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "16GB DDR4", "Armazenamento": "512GB NVMe", "Formato": "Slim" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Computador Gamer CPU I5-3470 16GB RAM SSD 240GB Gigalan",
      subtitle: "Intel Core I5 3ª Geração Gamer",
      description: "PC Gamer com Intel I5-3470, 16GB RAM e SSD 240GB com porta Gigalan.",
      categories: ["pc"],
      totalPrice: 1250,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_937358-MLB85080380083_052025-AB.webp" }],
      specs: { "Processador": "Intel Core I5-3470", "Memória RAM": "16GB DDR3", "Armazenamento": "240GB SSD", "Rede": "Gigabit LAN" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "Mini PC Slim Completo I7-6700 Intel 16GB DDR4 NVMe 256GB",
      subtitle: "Intel Core I7 6ª Geração Mini",
      description: "Mini PC Slim com Intel I7-6700, 16GB DDR4 e NVMe 256GB.",
      categories: ["pc"],
      totalPrice: 1749,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_643096-MLB96231793379_102025-AB.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "16GB DDR4", "Armazenamento": "256GB NVMe", "Formato": "Mini Slim" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "Mini PC Slim Computador CPU Intel I5-3470 SSD 480GB 16GB RAM",
      subtitle: "Intel Core I5 3ª Geração Mini",
      description: "Mini PC Slim com Intel I5-3470, 16GB RAM e SSD 480GB.",
      categories: ["pc"],
      totalPrice: 1139,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_689107-MLB92809604671_092025-AB.webp" }],
      specs: { "Processador": "Intel Core I5-3470", "Memória RAM": "16GB DDR3", "Armazenamento": "480GB SSD", "Formato": "Mini Slim" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "PC Slim Branco Office Intel I5-6500 16GB RAM NVMe 256GB",
      subtitle: "Intel Core I5 6ª Geração Slim Branco",
      description: "PC Slim Branco para escritório com Intel I5-6500, 16GB RAM e NVMe 256GB.",
      categories: ["pc"],
      totalPrice: 1605,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_915942-MLB79040516669_092024-AB.webp" }],
      specs: { "Processador": "Intel Core I5-6500", "Memória RAM": "16GB DDR4", "Armazenamento": "256GB NVMe", "Formato": "Slim Branco" },
      productType: "pc" as ProductCategory,
      components: {}
    },
    {
      title: "Computador Slim PC Intel I5 SSD 240GB 16GB RAM Branco",
      subtitle: "Intel Core I5 Slim Branco",
      description: "Computador Slim Branco com Intel I5, 16GB RAM e SSD 240GB.",
      categories: ["pc"],
      totalPrice: 1092,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_681050-MLB78999947361_092024-AB.webp" }],
      specs: { "Processador": "Intel Core I5", "Memória RAM": "16GB", "Armazenamento": "240GB SSD", "Formato": "Slim Branco" },
      productType: "pc" as ProductCategory,
      components: {}
    }
  ],
  kit: [
    // RDJINFO - Kits
    {
      title: "Kit Upgrade Intel I7-6700 32GB DDR4 NVMe 512GB",
      subtitle: "Kit Upgrade I7 6ª Geração",
      description: "Kit Upgrade completo com Intel I7-6700, 32GB DDR4 e NVMe 512GB.",
      categories: ["kit"],
      totalPrice: 2499,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "32GB DDR4", "Armazenamento": "512GB NVMe", "Placa Mãe": "H110" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade Intel I7-6700 32GB DDR4 Placa Mãe H110",
      subtitle: "Kit Upgrade I7 6ª Geração",
      description: "Kit Upgrade com Intel I7-6700, 32GB DDR4 e placa mãe H110.",
      categories: ["kit"],
      totalPrice: 1749,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "32GB DDR4", "Placa Mãe": "H110" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Gamer Intel I5-3470 DDR3 16GB NVMe 512GB H61/B75",
      subtitle: "Kit Gamer I5 3ª Geração",
      description: "Kit Gamer com Intel I5-3470, 16GB DDR3, NVMe 512GB e placa mãe H61/B75.",
      categories: ["kit"],
      totalPrice: 892,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-3470", "Memória RAM": "16GB DDR3", "Armazenamento": "512GB NVMe", "Placa Mãe": "H61/B75" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade Intel I7-6700 MB H110 8GB DDR4 NVMe 256GB",
      subtitle: "Kit Upgrade I7 6ª Geração",
      description: "Kit Upgrade com Intel I7-6700, placa mãe H110, 8GB DDR4 e NVMe 256GB.",
      categories: ["kit"],
      totalPrice: 1491,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "8GB DDR4", "Armazenamento": "256GB NVMe", "Placa Mãe": "H110" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade Intel I5-10400F H510 32GB DDR4 NVMe 512GB",
      subtitle: "Kit Upgrade I5 10ª Geração",
      description: "Kit Upgrade com Intel I5-10400F, placa mãe H510, 32GB DDR4 e NVMe 512GB.",
      categories: ["kit"],
      totalPrice: 2625,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-10400F", "Memória RAM": "32GB DDR4", "Armazenamento": "512GB NVMe", "Placa Mãe": "H510" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Intel Gamer I7 6ª Geração H110 Memória 8GB DDR4",
      subtitle: "Kit Gamer I7 6ª Geração",
      description: "Kit Gamer com Intel I7 6ª geração, placa H110 e 8GB DDR4.",
      categories: ["kit"],
      totalPrice: 1125,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7 6ª Geração", "Memória RAM": "8GB DDR4", "Placa Mãe": "H110" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade Intel I7-3770 H61 16GB DDR3 NVMe 256GB",
      subtitle: "Kit Upgrade I7 3ª Geração",
      description: "Kit Upgrade com Intel I7-3770, placa H61, 16GB DDR3 e NVMe 256GB.",
      categories: ["kit"],
      totalPrice: 854,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-3770", "Memória RAM": "16GB DDR3", "Armazenamento": "256GB NVMe", "Placa Mãe": "H61" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade Intel I5-4570 Placa Mãe H81 DDR3 16GB NVMe 256GB",
      subtitle: "Kit Upgrade I5 4ª Geração",
      description: "Kit Upgrade com Intel I5-4570, placa H81, 16GB DDR3 e NVMe 256GB.",
      categories: ["kit"],
      totalPrice: 816,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I5-4570", "Memória RAM": "16GB DDR3", "Armazenamento": "256GB NVMe", "Placa Mãe": "H81" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade Intel Core I7-6700 32GB DDR4 NVMe 256GB MB H110",
      subtitle: "Kit Upgrade I7 6ª Geração",
      description: "Kit Upgrade com Intel I7-6700, 32GB DDR4, NVMe 256GB e placa mãe H110.",
      categories: ["kit"],
      totalPrice: 1999,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "32GB DDR4", "Armazenamento": "256GB NVMe", "Placa Mãe": "H110" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade Intel Core I7-6700 32GB DDR4 NVMe 1TB MB H110",
      subtitle: "Kit Upgrade I7 6ª Geração Premium",
      description: "Kit Upgrade Premium com Intel I7-6700, 32GB DDR4, NVMe 1TB e placa mãe H110.",
      categories: ["kit"],
      totalPrice: 2599,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_NQ_NP_2X_626461-MLB52827693214_122022-F.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "32GB DDR4", "Armazenamento": "1TB NVMe", "Placa Mãe": "H110" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    // Kaytec - Kits
    {
      title: "Kit Upgrade PC Gamer Intel I5-3470 DDR3 16GB NVMe 256GB",
      subtitle: "Kit Upgrade I5 3ª Geração",
      description: "Kit Upgrade Gamer com Intel I5-3470, 16GB DDR3 e NVMe 256GB.",
      categories: ["kit"],
      totalPrice: 690,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_663663-MLB92318867893_092025-AB.webp" }],
      specs: { "Processador": "Intel Core I5-3470", "Memória RAM": "16GB DDR3", "Armazenamento": "256GB NVMe" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade PC Gamer CPU Intel I5-3470 DDR3 16GB MB H61",
      subtitle: "Kit Upgrade I5 3ª Geração",
      description: "Kit Upgrade Gamer com Intel I5-3470, 16GB DDR3 e placa mãe H61.",
      categories: ["kit"],
      totalPrice: 539,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_802295-MLB91913372330_092025-AB.webp" }],
      specs: { "Processador": "Intel Core I5-3470", "Memória RAM": "16GB DDR3", "Placa Mãe": "H61" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade PC Gamer CPU Intel I7-6700 DDR4 16GB NVMe 512GB",
      subtitle: "Kit Upgrade I7 6ª Geração",
      description: "Kit Upgrade Gamer com Intel I7-6700, 16GB DDR4 e NVMe 512GB.",
      categories: ["kit"],
      totalPrice: 1950,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_655839-MLB92318668379_092025-AB.webp" }],
      specs: { "Processador": "Intel Core I7-6700", "Memória RAM": "16GB DDR4", "Armazenamento": "512GB NVMe" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade PC Gamer CPU Intel I5-6500 DDR4 16GB NVMe 512GB",
      subtitle: "Kit Upgrade I5 6ª Geração",
      description: "Kit Upgrade Gamer com Intel I5-6500, 16GB DDR4 e NVMe 512GB.",
      categories: ["kit"],
      totalPrice: 1490,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_850978-MLB92317618795_092025-AB.webp" }],
      specs: { "Processador": "Intel Core I5-6500", "Memória RAM": "16GB DDR4", "Armazenamento": "512GB NVMe" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade PC Gamer CPU Intel I5-3470 16GB RAM SSD 240GB",
      subtitle: "Kit Upgrade I5 3ª Geração",
      description: "Kit Upgrade Gamer com Intel I5-3470, 16GB RAM e SSD 240GB.",
      categories: ["kit"],
      totalPrice: 711,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_738033-MLB92319211717_092025-AB.webp" }],
      specs: { "Processador": "Intel Core I5-3470", "Memória RAM": "16GB DDR3", "Armazenamento": "240GB SSD" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade PC Gamer Intel I5-3470 DDR3 8GB NVMe 256GB MB",
      subtitle: "Kit Upgrade I5 3ª Geração",
      description: "Kit Upgrade Gamer com Intel I5-3470, 8GB DDR3, NVMe 256GB e placa mãe.",
      categories: ["kit"],
      totalPrice: 725,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_641214-MLB91915007996_092025-AB.webp" }],
      specs: { "Processador": "Intel Core I5-3470", "Memória RAM": "8GB DDR3", "Armazenamento": "256GB NVMe" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Upgrade PC Gamer CPU Intel I5-3470 8GB RAM SSD 240GB",
      subtitle: "Kit Upgrade I5 3ª Geração",
      description: "Kit Upgrade Gamer com Intel I5-3470, 8GB RAM e SSD 240GB.",
      categories: ["kit"],
      totalPrice: 665,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_700855-MLB94455174894_102025-AB.webp" }],
      specs: { "Processador": "Intel Core I5-3470", "Memória RAM": "8GB DDR3", "Armazenamento": "240GB SSD" },
      productType: "kit" as ProductCategory,
      components: {}
    },
    {
      title: "Kit Gamer Intel I5-6500 DDR4 16GB NVMe 256GB MB H110",
      subtitle: "Kit Gamer I5 6ª Geração",
      description: "Kit Gamer com Intel I5-6500, 16GB DDR4, NVMe 256GB e placa mãe H110.",
      categories: ["kit"],
      totalPrice: 1290,
      media: [{ type: "image" as const, url: "https://http2.mlstatic.com/D_Q_NP_2X_643054-MLB78999254469_092024-AB.webp" }],
      specs: { "Processador": "Intel Core I5-6500", "Memória RAM": "16GB DDR4", "Armazenamento": "256GB NVMe", "Placa Mãe": "H110" },
      productType: "kit" as ProductCategory,
      components: {}
    }
  ]
};

export default function ImportProducts() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ pc: number; kit: number }>({ pc: 0, kit: 0 });
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const importAll = async () => {
    setImporting(true);
    setProgress({ pc: 0, kit: 0 });

    // Import PCs
    for (let i = 0; i < productsData.pc.length; i++) {
      try {
        await api.createProduct(productsData.pc[i]);
        setProgress(prev => ({ ...prev, pc: i + 1 }));
      } catch (error) {
        console.error(`Erro ao importar PC ${i + 1}:`, error);
      }
    }

    // Import Kits
    for (let i = 0; i < productsData.kit.length; i++) {
      try {
        await api.createProduct(productsData.kit[i]);
        setProgress(prev => ({ ...prev, kit: i + 1 }));
      } catch (error) {
        console.error(`Erro ao importar Kit ${i + 1}:`, error);
      }
    }

    setDone(true);
    setImporting(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Importar Produtos (PCs e Kits)</h1>
        <p className="text-muted-foreground mb-6">
          Este script irá importar {productsData.pc.length} PCs e {productsData.kit.length} Kits
          extraídos das lojas RDJINFO e Kaytec do Mercado Livre.
        </p>

        {!done ? (
          <Button
            onClick={importAll}
            disabled={importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Iniciar Importação
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>Importação concluída!</span>
            </div>
            <Button onClick={() => navigate('/loja')} className="w-full">
              Ver na Loja
            </Button>
          </div>
        )}

        {importing && (
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>PCs</span>
                <span>{progress.pc}/{productsData.pc.length}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(progress.pc / productsData.pc.length) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Kits</span>
                <span>{progress.kit}/{productsData.kit.length}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(progress.kit / productsData.kit.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
