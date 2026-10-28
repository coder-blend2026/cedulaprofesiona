<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 0; size: letter portrait; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1a1a1a;
            line-height: 1.2;
        }
        .sheet {
            position: relative;
            width: 215.9mm;
            height: 279.4mm;
            overflow: hidden;
        }
        /* Solo la primera página tiene salto forzado */
        .sheet--p1 { page-break-after: always; }
        
        .sheet__bg {
            position: absolute;
            left: 0; top: 0;
            width: 100%; height: 100%;
            z-index: 1;
        }
        .layer {
            position: relative;
            z-index: 2;
            padding: 35mm 18mm 15mm 18mm;
        }
        /* Centrado visual para la segunda página */
        .sheet--p2 .layer {
            padding-top: 48mm;
        }

        .header-meta {
            text-align: right;
            font-size: 8.5pt;
            margin-bottom: 10mm;
        }
        .folio { font-weight: normal; margin-right: 10mm; }

        h1.doc-title {
            margin: 0 0 15pt 0;
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            color: #611232;
            text-transform: uppercase;
        }
        h2.section-title {
            margin: 12pt 0 8pt 0;
            text-align: center;
            font-size: 10.5pt;
            font-weight: bold;
            color: #611232;
            text-transform: uppercase;
        }

        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5pt;
        }
        table.data-table th {
            font-size: 8.5pt;
            font-weight: bold;
            padding: 4pt 2pt;
            text-align: center;
        }
        table.data-table td {
            font-size: 9.5pt;
            padding: 2pt;
            text-align: center;
            text-transform: uppercase;
        }

        .prof-table th { font-size: 7.5pt; vertical-align: bottom; }
        .prof-table td { font-size: 7pt; padding: 4pt 2pt; }

        .empty-msg {
            text-align: center;
            font-style: italic;
            color: #666;
            font-size: 8pt;
            margin: 4pt 0;
        }

        .legal-text {
            font-size: 8.5pt;
            text-align: justify;
            line-height: 1.4;
            margin-bottom: 12pt;
        }
        .sig-block { width: 100%; margin-top: 25pt; }
        .sig-label { font-weight: bold; font-size: 8.5pt; display: block; }
        .sig-value { font-size: 8.5pt; display: block; text-transform: uppercase; }

        .chain-label { font-weight: bold; font-size: 9pt; margin-top: 15pt; }
        .chain-value {
            font-family: monospace;
            font-size: 6.5pt;
            word-break: break-all;
            margin-top: 2pt;
            line-height: 1.1;
        }

        .footer-table { width: 100%; margin-top: 25pt; }
        .qr-container { text-align: center; font-size: 7pt; }
        .qr-container img {
            width: 30mm;
            height: 30mm;
            margin-bottom: 4pt;
        }
    </style>
</head>
<body>

<div class="sheet sheet--p1">
    <img class="sheet__bg" src="<?= h($bg) ?>" alt="" />
    <div class="layer">
        <div class="header-meta">
            <span class="folio">Folio: <?= h($e['curp'] ?? '003474893') ?></span>
        </div>

        <h1 class="doc-title">Constancia de Situación Profesional</h1>

        <h2 class="section-title">Datos de la persona profesionista</h2>
        <table class="data-table">
            <tr>
                <th width="33.3%">Nombre(s)</th>
                <th width="33.3%">Primer apellido</th>
                <th width="33.3%">Segundo apellido</th>
            </tr>
            <tr>
                <td><?= h($e['nombre']) ?></td>
                <td><?= h($e['primerApellido']) ?></td>
                <td><?= h($e['segundoApellido'] ?? '—') ?></td>
            </tr>
        </table>

        <h2 class="section-title">Información Profesional</h2>
        <table class="data-table prof-table">
            <thead>
                <tr>
                    <th width="30%">Profesión</th>
                    <th width="30%">Institución Educativa</th>
                    <th width="13%">Fecha de Titulación</th>
                    <th width="13%">Cédula Profesional</th>
                    <th width="14%">Fecha de Expedición</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><?= h($e['profesion']) ?></td>
                    <td><?= h($e['institucion']) ?></td>
                    <td><?= h($fechaTitulacion) ?></td>
                    <td><?= h($e['cedula']) ?></td>
                    <td><?= h($fechaExpedicion) ?></td>
                </tr>
            </tbody>
        </table>

        <h2 class="section-title">Colegio de Profesionistas</h2>
        <p class="empty-msg">No se encontró información de colegios.</p>

        <h2 class="section-title">Certificaciones</h2>
        <p class="empty-msg">No se encontró información de certificaciones.</p>

        <h2 class="section-title">Competencias Transversales</h2>
        <p class="empty-msg">No se encontró información de competencias.</p>

        <h2 class="section-title">De las Sanciones</h2>
        <p class="empty-msg">No se encontró información de sanciones.</p>
    </div>
</div>

<div class="sheet sheet--p2">
    <img class="sheet__bg" src="<?= h($bg) ?>" alt="" />
    <div class="layer">
        <div class="header-meta">
            <span class="folio">Folio: <?= h($e['curp'] ?? '003474893') ?></span>
        </div>

        <p class="legal-text">
            La presente constancia se expide en cumplimiento de lo dispuesto en el artículo 16 de la Constitución Política de los Estados Unidos Mexicanos; los artículos 22, fracción III y VI, 66 y 70, fracciones II y VII, de la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados; así como los artículos 2, 3, 7, 21, 23, fracciones I, III, IV, VII, XIV y XV, de la Ley Reglamentaria del artículo 5º Constitucional. La información proporcionada se otorga exclusivamente para los fines legales correspondientes.
        </p>

        <p class="legal-text">
            El presente documento se expide en la Ciudad de México, el <?= h($fechaActual ?? 'jueves 19 de marzo de 2026') ?>.
        </p>

        <table class="sig-block">
            <tr>
                <td width="55%">
                    <span class="sig-label">Nombre del firmante</span>
                    <span class="sig-value">ISRAEL JERÓNIMO LÓPEZ</span>
                </td>
                <td width="45%">
                    <span class="sig-label">Cargo</span>
                    <span class="sig-value">DIRECTOR DE AUTORIZACIÓN Y REGISTRO PROFESIONAL</span>
                </td>
            </tr>
        </table>

        <div style="margin-top: 15pt;">
            <span class="sig-label">Vigencia de la constancia</span>
            <span class="sig-value" style="text-transform: none;">30 días a partir de su expedición</span>
        </div>

        <div class="chain-label">Cadena original</div>
        <div class="chain-value"><?= h($cadena) ?></div>
        <br>
        <br>
        <br>
        <br>
        <br>
        <br>
        <br>
        <br>
        <br>
        <br>
        <table class="footer-table">
            <tr>
                <td width="50%" style="vertical-align: top;">
                    <div class="chain-label" style="margin-top: 0;">Firma electrónica</div>
                    <div class="chain-value">eX7edX/Mxq8yu01xF5Hg17i1MD4y0Uy0qbbJaCxk95Od6DfnqQ8EfRZf7oYnabKvFI9qbODyWkoZNVISEW4J5lKBDNmYpd3XcekNLJbiTjA
jjprKjCVzngEy/H5qwIe3DPUZ3fvAx36QFWheR+oxm+r2lQu4ckOc5gDwUeB4v6Ghb1MUIzyaSRyl54sbAg4e2XWSHcbsQ9yzhKos93dGJ
sVr/kCF6v5Ddis1Ii8wuS1Pi30YWU3gNNTl6WFy0ov6YTR7CgaRPTPXT0SvO6RmGwjpz/E8tYgzr/R/jFUrmhmbmKk/4aRBg+4hitChhEd9+
Lh9Ny47VN+gT3sU6E5HeA=</div>
                    
                    <div class="chain-label">Sello digital</div>
                    <div class="chain-value">eirVyfVGeszP1DGTFA8lArnQVbJ39ZYFgAWQE9bZWON89MxU6o1etxA6eaI1J5nthiM8P+rqi/RnUD9vv3bG4+Z+jCCmgqf7wy9FESR5MII
qNU9OvXYnjNsxbMiSVIBJbl1uP6DSIJLXemdYQe+0ZTeAue+5LleYzCocrgK57jJA15eDs6WyvhCzF/HV2bXnJ0TdsPDyh+tIXmtGwTP1sHRX
zUqpzdhFA6XS/7y4jfQ6Asj6xxHLLVwNhLozhVGhyn0pgGNxJNl8rQQTq/G0uI5kc53QPkl1Qa+uJ7Yg2Q2oSIIUsxc0lWJjo5f+06INKwefXL
NQhL5+yv3WyJjX3w=</div>
                </td>
                <td width="35%" class="qr-container">
                    <img src="<?= h($qrSrc) ?>" alt="QR">
                </td>
            </tr>
        </table>
    </div>
</div>

</body>
</html>