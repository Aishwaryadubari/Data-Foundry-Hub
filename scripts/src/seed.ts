import { db } from "@workspace/db";
import {
  usersTable, categoriesTable, templatesTable, tagsTable,
  templateTagsTable, ratingsTable, downloadsTable, templateVersionsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "dth_salt_2024").digest("hex");
}

async function seed() {
  console.log("🌱 Starting seed...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.email, "admin@datahub.io"));
  let adminId: number;
  let userId: number;
  let devId: number;

  if (existingAdmin.length === 0) {
    const [admin] = await db.insert(usersTable).values({
      email: "admin@datahub.io", name: "DataHub Admin",
      passwordHash: hashPassword("admin123"), role: "admin",
    }).returning();
    adminId = admin.id;

    const [user] = await db.insert(usersTable).values({
      email: "user@datahub.io", name: "Data Engineer",
      passwordHash: hashPassword("user123"), role: "user",
    }).returning();
    userId = user.id;

    const [dev] = await db.insert(usersTable).values({
      email: "sarah@datahub.io", name: "Sarah Chen",
      passwordHash: hashPassword("sarah123"), role: "user",
    }).returning();
    devId = dev.id;

    const [dev2] = await db.insert(usersTable).values({
      email: "marcus@datahub.io", name: "Marcus Rivera",
      passwordHash: hashPassword("marcus123"), role: "user",
    }).returning();

    const [dev3] = await db.insert(usersTable).values({
      email: "priya@datahub.io", name: "Priya Nair",
      passwordHash: hashPassword("priya123"), role: "user",
    }).returning();

    console.log("✅ Users created");
  } else {
    adminId = existingAdmin[0].id;
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, "user@datahub.io"));
    userId = existingUser[0]?.id ?? adminId;
    const existingSarah = await db.select().from(usersTable).where(eq(usersTable.email, "sarah@datahub.io"));
    devId = existingSarah[0]?.id ?? adminId;
    console.log("ℹ️  Users already exist");
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  const existingCats = await db.select().from(categoriesTable);
  let catMap: Record<string, number> = {};

  if (existingCats.length === 0) {
    const cats = [
      { name: "SQL Queries", slug: "sql", icon: "Database", description: "SQL queries for data warehouses, analytics, and transformations", color: "#3b82f6", sortOrder: 1 },
      { name: "ADF Pipelines", slug: "adf", icon: "GitBranch", description: "Azure Data Factory pipeline templates and patterns", color: "#f97316", sortOrder: 2 },
      { name: "Fabric Workflows", slug: "fabric", icon: "Layers", description: "Microsoft Fabric notebooks, lakehouses, and workflows", color: "#8b5cf6", sortOrder: 3 },
      { name: "Databricks", slug: "databricks", icon: "Zap", description: "Databricks notebooks, jobs, and cluster configurations", color: "#ef4444", sortOrder: 4 },
      { name: "GitHub Actions", slug: "github-actions", icon: "GitBranch", description: "CI/CD workflows for data engineering pipelines", color: "#10b981", sortOrder: 5 },
      { name: "Monitoring", slug: "monitoring", icon: "Activity", description: "Data pipeline monitoring, alerting, and observability", color: "#06b6d4", sortOrder: 6 },
      { name: "Data Quality", slug: "data-quality", icon: "Shield", description: "Data validation, quality checks, and testing frameworks", color: "#22c55e", sortOrder: 7 },
      { name: "ETL/ELT Patterns", slug: "etl-elt", icon: "Layers", description: "Extract, transform, load patterns and best practices", color: "#eab308", sortOrder: 8 },
      { name: "CI/CD Pipelines", slug: "cicd", icon: "GitBranch", description: "Continuous integration and deployment for data projects", color: "#ec4899", sortOrder: 9 },
      { name: "Spark Jobs", slug: "spark", icon: "Zap", description: "Apache Spark batch and streaming job templates", color: "#fb923c", sortOrder: 10 },
      { name: "Incident Response", slug: "incident-response", icon: "AlertTriangle", description: "Runbooks and playbooks for data pipeline incidents", color: "#f87171", sortOrder: 11 },
    ];
    for (const cat of cats) {
      const [c] = await db.insert(categoriesTable).values(cat).returning();
      catMap[cat.slug] = c.id;
    }
    console.log("✅ Categories created");
  } else {
    for (const cat of existingCats) {
      catMap[cat.slug] = cat.id;
    }
    console.log("ℹ️  Categories already exist");
  }

  // ── Tags ───────────────────────────────────────────────────────────────────
  const tagNames = [
    "scd2", "dimension", "warehouse", "snowflake", "bigquery", "synapse",
    "partitioning", "incremental", "full-load", "upsert", "merge", "dbt",
    "azure", "aws", "gcp", "python", "pyspark", "scala", "sql", "yaml",
    "monitoring", "alerting", "data-quality", "validation", "testing",
    "delta-lake", "parquet", "lakehouse", "fabric", "databricks",
    "adf", "pipeline", "etl", "elt", "streaming", "batch",
    "cicd", "github-actions", "terraform", "iac", "devops",
    "incident", "runbook", "playbook", "oncall", "performance",
  ];
  const existingTags = await db.select().from(tagsTable);
  const tagMap: Record<string, number> = {};
  for (const t of existingTags) tagMap[t.name] = t.id;

  for (const name of tagNames) {
    if (!tagMap[name]) {
      const [tag] = await db.insert(tagsTable).values({ name }).returning();
      tagMap[name] = tag.id;
    }
  }
  console.log("✅ Tags created");

  // ── Templates ──────────────────────────────────────────────────────────────
  const existingTemplates = await db.select().from(templatesTable);
  if (existingTemplates.length > 0) {
    console.log("ℹ️  Templates already exist, skipping");
    console.log("🎉 Seed complete!");
    process.exit(0);
  }

  const templates = [
    // SQL
    {
      title: "Slowly Changing Dimension Type 2 (SCD2)",
      description: "Production-ready SCD2 implementation using MERGE statement for Snowflake and Synapse Analytics. Handles inserts, updates, and historical tracking with effective dates.",
      categoryId: catMap["sql"],
      authorId: adminId,
      version: "2.1.0",
      language: "sql",
      complexity: "intermediate",
      isFeatured: 1,
      downloads: 3847,
      averageRating: 4.8,
      ratingCount: 124,
      tags: ["scd2", "dimension", "warehouse", "snowflake", "upsert", "merge"],
      code: `-- SCD Type 2 Implementation using MERGE
-- Compatible with: Snowflake, Azure Synapse, BigQuery

MERGE INTO dim_customers AS target
USING (
    SELECT
        customer_id,
        customer_name,
        email,
        city,
        state,
        country,
        CURRENT_TIMESTAMP() AS load_date
    FROM staging.customers
) AS source
ON (target.customer_id = source.customer_id AND target.is_current = TRUE)

-- Close existing record if any attribute changed
WHEN MATCHED AND (
    target.customer_name != source.customer_name OR
    target.email != source.email OR
    target.city != source.city
) THEN UPDATE SET
    target.is_current = FALSE,
    target.effective_end_date = CURRENT_TIMESTAMP(),
    target.updated_at = CURRENT_TIMESTAMP()

-- Insert new or updated records
WHEN NOT MATCHED THEN INSERT (
    customer_id, customer_name, email, city, state, country,
    effective_start_date, effective_end_date, is_current, created_at
)
VALUES (
    source.customer_id, source.customer_name, source.email,
    source.city, source.state, source.country,
    CURRENT_TIMESTAMP(), '9999-12-31', TRUE, CURRENT_TIMESTAMP()
);

-- Insert updated records as new rows (handled by trigger or second pass)
INSERT INTO dim_customers (
    customer_id, customer_name, email, city, state, country,
    effective_start_date, effective_end_date, is_current, created_at
)
SELECT
    s.customer_id, s.customer_name, s.email, s.city, s.state, s.country,
    CURRENT_TIMESTAMP(), '9999-12-31', TRUE, CURRENT_TIMESTAMP()
FROM staging.customers s
INNER JOIN dim_customers d ON s.customer_id = d.customer_id
WHERE d.is_current = FALSE AND d.updated_at >= CURRENT_TIMESTAMP() - INTERVAL '1 minute';`,
      documentation: `# SCD Type 2 Implementation

## Overview
Slowly Changing Dimension Type 2 (SCD2) tracks historical changes by creating new rows when attributes change, preserving the full history.

## How It Works
1. **MERGE statement** compares staging data against current dimension records
2. **Changed records** are expired (is_current = FALSE, effective_end_date set)
3. **New rows** are inserted with is_current = TRUE and new effective dates
4. **Unchanged records** are left as-is

## Configuration
- Change the \`ON\` clause to match your natural key
- Update the \`WHEN MATCHED AND\` conditions to include your tracked attributes
- Adjust timestamp functions for your SQL dialect

## Performance Tips
- Index on \`(customer_id, is_current)\`
- Partition by \`effective_start_date\` for large tables
- Consider clustering keys in Snowflake`,
      usageExample: `-- Before running, ensure staging table exists:
CREATE TABLE staging.customers AS
SELECT * FROM raw.customers WHERE load_date = CURRENT_DATE();

-- Run the merge:
EXEC sp_scd2_customers;`,
      prerequisites: "Staging table must be populated before running. Requires MERGE permissions on target schema.",
    },
    {
      title: "Incremental Load with Watermark",
      description: "Generic incremental data loading pattern using high-watermark strategy. Supports multiple source systems and handles late-arriving data gracefully.",
      categoryId: catMap["sql"],
      authorId: devId,
      version: "1.3.0",
      language: "sql",
      complexity: "beginner",
      isFeatured: 0,
      downloads: 2156,
      averageRating: 4.5,
      ratingCount: 89,
      tags: ["incremental", "watermark", "etl", "warehouse", "sql"],
      code: `-- Incremental Load with Watermark Pattern
-- Tracks last successful load timestamp to fetch only new/changed records

DECLARE @last_watermark DATETIME2 = (
    SELECT COALESCE(MAX(watermark_value), '1900-01-01')
    FROM etl_control.watermark_table
    WHERE source_table = 'orders'
);

DECLARE @current_watermark DATETIME2 = GETUTCDATE();

-- Extract incremental data
INSERT INTO staging.orders_delta
SELECT
    order_id,
    customer_id,
    order_date,
    total_amount,
    status,
    updated_at,
    @current_watermark AS load_timestamp
FROM source.orders
WHERE updated_at > @last_watermark
  AND updated_at <= @current_watermark;

-- Upsert into target table
MERGE INTO dw.fact_orders AS target
USING staging.orders_delta AS source
ON target.order_id = source.order_id
WHEN MATCHED THEN
    UPDATE SET
        customer_id = source.customer_id,
        total_amount = source.total_amount,
        status = source.status,
        updated_at = source.updated_at,
        load_timestamp = source.load_timestamp
WHEN NOT MATCHED THEN
    INSERT (order_id, customer_id, order_date, total_amount, status, updated_at, load_timestamp)
    VALUES (source.order_id, source.customer_id, source.order_date,
            source.total_amount, source.status, source.updated_at, source.load_timestamp);

-- Update watermark on success
UPDATE etl_control.watermark_table
SET watermark_value = @current_watermark,
    last_run_at = GETUTCDATE()
WHERE source_table = 'orders';`,
      documentation: "Watermark-based incremental loading that fetches only records changed since the last run. Uses a control table to persist watermark values across runs.",
      usageExample: "-- Set up control table first:\nCREATE TABLE etl_control.watermark_table (source_table VARCHAR(100), watermark_value DATETIME2, last_run_at DATETIME2);",
      prerequisites: "Control schema `etl_control` must exist. Service account needs SELECT on source, INSERT/UPDATE on staging and dw schemas.",
    },
    {
      title: "Data Quality Assertions Framework",
      description: "Comprehensive SQL-based data quality checks covering nulls, duplicates, referential integrity, range checks, and business rule validation.",
      categoryId: catMap["data-quality"],
      authorId: adminId,
      version: "1.5.0",
      language: "sql",
      complexity: "intermediate",
      isFeatured: 1,
      downloads: 1923,
      averageRating: 4.9,
      ratingCount: 76,
      tags: ["data-quality", "validation", "testing", "sql", "assertions"],
      code: `-- Data Quality Assertion Framework
-- Run these checks as part of your pipeline before loading to production

-- 1. NULL CHECKS
SELECT 'null_check_customer_id' AS check_name,
       COUNT(*) AS failed_records,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM staging.orders
WHERE customer_id IS NULL

UNION ALL

-- 2. DUPLICATE CHECK
SELECT 'duplicate_check_order_id' AS check_name,
       COUNT(*) - COUNT(DISTINCT order_id) AS failed_records,
       CASE WHEN COUNT(*) = COUNT(DISTINCT order_id) THEN 'PASS' ELSE 'FAIL' END AS status
FROM staging.orders

UNION ALL

-- 3. REFERENTIAL INTEGRITY
SELECT 'ref_integrity_customer_id' AS check_name,
       COUNT(*) AS failed_records,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM staging.orders o
LEFT JOIN dim_customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL

UNION ALL

-- 4. RANGE CHECK
SELECT 'range_check_total_amount' AS check_name,
       SUM(CASE WHEN total_amount < 0 OR total_amount > 1000000 THEN 1 ELSE 0 END) AS failed_records,
       CASE WHEN SUM(CASE WHEN total_amount < 0 OR total_amount > 1000000 THEN 1 ELSE 0 END) = 0
            THEN 'PASS' ELSE 'FAIL' END AS status
FROM staging.orders

UNION ALL

-- 5. DATE VALIDITY
SELECT 'date_check_order_date' AS check_name,
       SUM(CASE WHEN order_date > CURRENT_DATE() OR order_date < '2000-01-01' THEN 1 ELSE 0 END) AS failed_records,
       CASE WHEN SUM(CASE WHEN order_date > CURRENT_DATE() OR order_date < '2000-01-01' THEN 1 ELSE 0 END) = 0
            THEN 'PASS' ELSE 'FAIL' END AS status
FROM staging.orders

UNION ALL

-- 6. FRESHNESS CHECK
SELECT 'freshness_check' AS check_name,
       CASE WHEN MAX(updated_at) < DATEADD(hour, -24, CURRENT_TIMESTAMP()) THEN 1 ELSE 0 END AS failed_records,
       CASE WHEN MAX(updated_at) >= DATEADD(hour, -24, CURRENT_TIMESTAMP()) THEN 'PASS' ELSE 'FAIL' END AS status
FROM staging.orders;`,
      documentation: "Run quality checks before loading data to catch issues early. Add to your pipeline as a pre-load gate — fail the pipeline if any check fails.",
      usageExample: `-- Wrap in a procedure to fail on any FAIL result:
EXEC sp_run_quality_checks;
IF EXISTS (SELECT 1 FROM quality_results WHERE status = 'FAIL') THEN RAISE EXCEPTION 'DQ Check failed';`,
      prerequisites: "Staging tables must be populated. Dimension tables must exist for referential integrity checks.",
    },

    // ADF
    {
      title: "ADF Generic Copy Pipeline with Retry Logic",
      description: "Parameterized Azure Data Factory pipeline for copying data from any JDBC source to Azure Data Lake Storage Gen2 with configurable retry, error handling, and metadata logging.",
      categoryId: catMap["adf"],
      authorId: devId,
      version: "3.0.0",
      language: "json",
      complexity: "intermediate",
      isFeatured: 1,
      downloads: 2934,
      averageRating: 4.7,
      ratingCount: 98,
      tags: ["adf", "pipeline", "azure", "copy", "retry", "adls"],
      code: `{
  "name": "pl_generic_copy_jdbc_to_adls",
  "properties": {
    "parameters": {
      "sourceTable": { "type": "string" },
      "sinkContainer": { "type": "string", "defaultValue": "raw" },
      "sinkFolder": { "type": "string" },
      "watermarkColumn": { "type": "string", "defaultValue": "updated_at" },
      "lastWatermark": { "type": "string", "defaultValue": "1900-01-01" },
      "maxRetries": { "type": "int", "defaultValue": 3 }
    },
    "activities": [
      {
        "name": "LookupWatermark",
        "type": "Lookup",
        "typeProperties": {
          "source": {
            "type": "AzureSqlSource",
            "sqlReaderQuery": {
              "value": "SELECT ISNULL(MAX(watermark_value), '1900-01-01') AS last_watermark FROM etl_control.pipeline_watermarks WHERE pipeline_name = '@{pipeline().RunId}'",
              "type": "Expression"
            }
          }
        }
      },
      {
        "name": "CopyData",
        "type": "Copy",
        "dependsOn": [{ "activity": "LookupWatermark", "dependencyConditions": ["Succeeded"] }],
        "policy": { "retry": "@pipeline().parameters.maxRetries", "retryIntervalInSeconds": 60 },
        "typeProperties": {
          "source": {
            "type": "JdbcSource",
            "query": {
              "value": "SELECT * FROM @{pipeline().parameters.sourceTable} WHERE @{pipeline().parameters.watermarkColumn} > '@{activity('LookupWatermark').output.firstRow.last_watermark}'",
              "type": "Expression"
            }
          },
          "sink": {
            "type": "DelimitedTextSink",
            "storeSettings": {
              "type": "AzureBlobFSWriteSettings",
              "copyBehavior": "PreserveHierarchy"
            },
            "formatSettings": { "type": "DelimitedTextWriteSettings", "fileExtension": ".csv" }
          },
          "enableStaging": false
        },
        "outputs": [{
          "referenceName": "ds_adls_output",
          "type": "DatasetReference",
          "parameters": {
            "container": "@pipeline().parameters.sinkContainer",
            "folder": "@concat(pipeline().parameters.sinkFolder, '/', formatDateTime(utcnow(), 'yyyy/MM/dd'))"
          }
        }]
      },
      {
        "name": "UpdateWatermark",
        "type": "SqlServerStoredProcedure",
        "dependsOn": [{ "activity": "CopyData", "dependencyConditions": ["Succeeded"] }],
        "typeProperties": {
          "storedProcedureName": "etl_control.usp_update_watermark",
          "storedProcedureParameters": {
            "pipeline_name": { "value": "@pipeline().RunId", "type": "String" },
            "watermark_value": { "value": "@utcnow()", "type": "String" },
            "rows_copied": { "value": "@activity('CopyData').output.rowsCopied", "type": "Int32" }
          }
        }
      },
      {
        "name": "OnFailure_LogError",
        "type": "SqlServerStoredProcedure",
        "dependsOn": [{ "activity": "CopyData", "dependencyConditions": ["Failed"] }],
        "typeProperties": {
          "storedProcedureName": "etl_control.usp_log_pipeline_error",
          "storedProcedureParameters": {
            "pipeline_run_id": { "value": "@pipeline().RunId", "type": "String" },
            "error_message": { "value": "@activity('CopyData').output.errors[0].Message", "type": "String" }
          }
        }
      }
    ]
  }
}`,
      documentation: "Generic ADF pipeline that handles any JDBC source with watermark-based incremental loading, retry logic, and full audit logging.",
      usageExample: `// Trigger with parameters:
{
  "sourceTable": "sales.orders",
  "sinkContainer": "raw",
  "sinkFolder": "sales/orders",
  "watermarkColumn": "updated_at"
}`,
      prerequisites: "Linked services for source JDBC and ADLS Gen2 must be configured. Control tables (etl_control schema) must exist.",
    },

    // Databricks
    {
      title: "PySpark Streaming with Delta Lake Upsert",
      description: "Production-grade PySpark Structured Streaming job that reads from Kafka, applies transformations, and performs MERGE INTO Delta Lake tables with exactly-once semantics.",
      categoryId: catMap["databricks"],
      authorId: adminId,
      version: "1.2.0",
      language: "python",
      complexity: "advanced",
      isFeatured: 1,
      downloads: 1567,
      averageRating: 4.6,
      ratingCount: 54,
      tags: ["pyspark", "streaming", "delta-lake", "kafka", "databricks", "upsert"],
      code: `# PySpark Structured Streaming with Delta Lake Upsert
# Databricks Runtime 13.x+ / Spark 3.4+

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, current_timestamp, sha2, concat_ws
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType
from delta.tables import DeltaTable

spark = SparkSession.builder.appName("StreamingDeltaUpsert").getOrCreate()
spark.conf.set("spark.sql.shuffle.partitions", "auto")
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")
spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")

# Schema definition
ORDER_SCHEMA = StructType([
    StructField("order_id", StringType(), False),
    StructField("customer_id", StringType(), False),
    StructField("product_id", StringType(), False),
    StructField("quantity", DoubleType(), True),
    StructField("unit_price", DoubleType(), True),
    StructField("status", StringType(), True),
    StructField("event_time", TimestampType(), False),
])

KAFKA_CONFIG = {
    "kafka.bootstrap.servers": spark.conf.get("spark.kafka.bootstrap.servers"),
    "subscribe": "orders.events",
    "startingOffsets": "latest",
    "failOnDataLoss": "false",
    "maxOffsetsPerTrigger": "10000",
}

DELTA_TABLE_PATH = "dbfs:/delta/fact_orders"
CHECKPOINT_PATH = "dbfs:/checkpoints/orders_streaming"

def upsert_to_delta(micro_batch_df, batch_id):
    """Upsert micro-batch DataFrame into Delta table using MERGE."""
    if micro_batch_df.isEmpty():
        return

    # Deduplicate within micro-batch (last event wins)
    deduped = (
        micro_batch_df
        .withColumn("row_num", F.row_number().over(
            Window.partitionBy("order_id").orderBy(col("event_time").desc())
        ))
        .filter(col("row_num") == 1)
        .drop("row_num")
        .withColumn("processed_at", current_timestamp())
        .withColumn("record_hash", sha2(concat_ws("|", col("status"), col("quantity"), col("unit_price")), 256))
    )

    delta_table = DeltaTable.forPath(spark, DELTA_TABLE_PATH)
    (
        delta_table.alias("target")
        .merge(deduped.alias("source"), "target.order_id = source.order_id")
        .whenMatchedUpdate(
            condition="source.record_hash != target.record_hash",
            set={
                "quantity": "source.quantity",
                "unit_price": "source.unit_price",
                "status": "source.status",
                "event_time": "source.event_time",
                "processed_at": "source.processed_at",
                "record_hash": "source.record_hash",
            }
        )
        .whenNotMatchedInsertAll()
        .execute()
    )

    print(f"Batch {batch_id}: processed {deduped.count()} records")

# Create Delta table if not exists
spark.sql(f"""
    CREATE TABLE IF NOT EXISTS delta.\`{DELTA_TABLE_PATH}\`
    (order_id STRING, customer_id STRING, product_id STRING,
     quantity DOUBLE, unit_price DOUBLE, status STRING,
     event_time TIMESTAMP, processed_at TIMESTAMP, record_hash STRING)
    USING DELTA
    PARTITIONED BY (DATE(event_time))
""")

# Start stream
query = (
    spark.readStream
    .format("kafka")
    .options(**KAFKA_CONFIG)
    .load()
    .select(from_json(col("value").cast("string"), ORDER_SCHEMA).alias("data"))
    .select("data.*")
    .filter(col("order_id").isNotNull())
    .writeStream
    .format("delta")
    .foreachBatch(upsert_to_delta)
    .outputMode("update")
    .option("checkpointLocation", CHECKPOINT_PATH)
    .trigger(processingTime="30 seconds")
    .start()
)

query.awaitTermination()`,
      documentation: "Production Databricks streaming job using Structured Streaming + Delta Lake. Handles deduplication, exactly-once semantics, and auto-optimization.",
      usageExample: `# Deploy as Databricks Job:
# Runtime: 13.3 LTS ML
# Cluster: Stream Optimized, with Kafka libraries
# Schedule: Continuous`,
      prerequisites: "Databricks Runtime 13.x+, Delta Lake 2.4+, Kafka connectivity, appropriate IAM/service principal permissions.",
    },

    // GitHub Actions
    {
      title: "dbt CI/CD Pipeline with Data Quality Gates",
      description: "Complete GitHub Actions workflow for dbt projects: model tests, schema validation, data quality checks, PR previews with slim CI, and production deployments.",
      categoryId: catMap["github-actions"],
      authorId: devId,
      version: "2.0.0",
      language: "yaml",
      complexity: "intermediate",
      isFeatured: 0,
      downloads: 2201,
      averageRating: 4.8,
      ratingCount: 87,
      tags: ["cicd", "github-actions", "dbt", "yaml", "testing", "devops"],
      code: `name: dbt CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    paths: ['dbt/**', '.github/workflows/dbt*.yml']
  pull_request:
    branches: [main]
    paths: ['dbt/**']

env:
  DBT_PROFILES_DIR: ./dbt/profiles
  DBT_PROJECT_DIR: ./dbt

jobs:
  # ── PR Preview / Slim CI ──────────────────────────────────────────────────
  dbt-ci:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # needed for state comparison

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip

      - name: Install dbt
        run: pip install dbt-snowflake==1.7.0 dbt-utils

      - name: dbt deps
        run: dbt deps --project-dir \$DBT_PROJECT_DIR
        env:
          DBT_SNOWFLAKE_ACCOUNT: \${{ secrets.SNOWFLAKE_ACCOUNT }}

      - name: dbt compile (PR check)
        run: dbt compile --project-dir \$DBT_PROJECT_DIR
        env:
          SNOWFLAKE_PASSWORD: \${{ secrets.SNOWFLAKE_PASSWORD_STAGING }}

      - name: dbt run (modified models only — slim CI)
        run: |
          dbt run \\
            --project-dir \$DBT_PROJECT_DIR \\
            --select state:modified+ \\
            --defer \\
            --state ./prod_artifacts \\
            --target ci
        env:
          SNOWFLAKE_PASSWORD: \${{ secrets.SNOWFLAKE_PASSWORD_STAGING }}

      - name: dbt test (modified models)
        run: |
          dbt test \\
            --project-dir \$DBT_PROJECT_DIR \\
            --select state:modified+ \\
            --defer \\
            --state ./prod_artifacts

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: dbt-test-results-pr-\${{ github.event.number }}
          path: dbt/target/run_results.json

  # ── Production Deployment ─────────────────────────────────────────────────
  dbt-prod:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    concurrency:
      group: dbt-prod
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@v4

      - name: Install dbt
        run: pip install dbt-snowflake==1.7.0

      - name: dbt deps
        run: dbt deps --project-dir \$DBT_PROJECT_DIR

      - name: dbt build (full run + tests)
        run: |
          dbt build \\
            --project-dir \$DBT_PROJECT_DIR \\
            --target prod \\
            --full-refresh false
        env:
          SNOWFLAKE_PASSWORD: \${{ secrets.SNOWFLAKE_PASSWORD_PROD }}

      - name: Data Quality Gate
        run: |
          python scripts/check_dq_results.py \\
            --results-path dbt/target/run_results.json \\
            --fail-on error

      - name: Generate dbt docs
        run: dbt docs generate --project-dir \$DBT_PROJECT_DIR

      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          channel-id: 'data-alerts'
          slack-message: "❌ dbt prod run FAILED on \`\${{ github.ref }}\`\\n<\${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}|View Run>"
        env:
          SLACK_BOT_TOKEN: \${{ secrets.SLACK_BOT_TOKEN }}`,
      documentation: "Full dbt CI/CD setup with slim CI for PRs (only runs modified models) and full production deployment on main branch merges.",
      usageExample: "Copy to .github/workflows/dbt-cicd.yml and configure secrets: SNOWFLAKE_ACCOUNT, SNOWFLAKE_PASSWORD_STAGING, SNOWFLAKE_PASSWORD_PROD, SLACK_BOT_TOKEN",
      prerequisites: "dbt project, Snowflake connection, GitHub environments (staging/production) configured with secrets.",
    },

    // Monitoring
    {
      title: "Pipeline Health Dashboard — Prometheus Metrics",
      description: "Python exporter that scrapes ADF, Databricks, and dbt pipeline metrics and exposes them as Prometheus metrics for Grafana dashboards.",
      categoryId: catMap["monitoring"],
      authorId: adminId,
      version: "1.0.0",
      language: "python",
      complexity: "advanced",
      isFeatured: 0,
      downloads: 876,
      averageRating: 4.4,
      ratingCount: 32,
      tags: ["monitoring", "alerting", "prometheus", "grafana", "python", "devops"],
      code: `#!/usr/bin/env python3
"""Data Pipeline Prometheus Metrics Exporter
Scrapes ADF, Databricks, and dbt Cloud metrics and exposes them for Grafana.
"""

import time
import logging
from prometheus_client import start_http_server, Gauge, Counter, Histogram, REGISTRY
from azure.mgmt.datafactory import DataFactoryManagementClient
from azure.identity import DefaultAzureCredential
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Metric Definitions ────────────────────────────────────────────────────
PIPELINE_RUNS = Counter(
    "adf_pipeline_runs_total",
    "Total ADF pipeline run attempts",
    ["pipeline_name", "status"]
)
PIPELINE_DURATION = Histogram(
    "adf_pipeline_duration_seconds",
    "ADF pipeline run duration",
    ["pipeline_name"],
    buckets=[30, 60, 300, 600, 1800, 3600, 7200]
)
PIPELINE_FAILURES_24H = Gauge(
    "adf_pipeline_failures_24h",
    "Failed pipeline runs in last 24 hours",
    ["pipeline_name"]
)
DATABRICKS_JOB_RUNS = Gauge(
    "databricks_job_runs_active",
    "Currently active Databricks job runs",
    ["job_name", "cluster_type"]
)
DBT_TEST_FAILURES = Gauge(
    "dbt_test_failures_total",
    "dbt test failures in latest run",
    ["model", "test_type"]
)
DATA_FRESHNESS_SECONDS = Gauge(
    "data_table_freshness_seconds",
    "Seconds since last successful data load",
    ["schema", "table"]
)

class PipelineMetricsCollector:
    def __init__(self, subscription_id: str, rg: str, adf_name: str):
        self.credential = DefaultAzureCredential()
        self.adf_client = DataFactoryManagementClient(self.credential, subscription_id)
        self.rg = rg
        self.adf_name = adf_name

    def collect_adf_metrics(self):
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        since = now - timedelta(hours=24)

        runs = self.adf_client.pipeline_runs.query_by_factory(
            self.rg, self.adf_name,
            {"lastUpdatedAfter": since.isoformat(), "lastUpdatedBefore": now.isoformat()}
        )

        failure_counts = {}
        for run in runs.value:
            name = run.pipeline_name
            status = run.status.lower()
            PIPELINE_RUNS.labels(pipeline_name=name, status=status).inc()

            if run.duration_in_ms:
                PIPELINE_DURATION.labels(pipeline_name=name).observe(run.duration_in_ms / 1000)

            if status == "failed":
                failure_counts[name] = failure_counts.get(name, 0) + 1

        for name, count in failure_counts.items():
            PIPELINE_FAILURES_24H.labels(pipeline_name=name).set(count)

        logger.info(f"Collected {len(runs.value)} ADF pipeline runs")

    def collect_databricks_metrics(self, workspace_url: str, token: str):
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{workspace_url}/api/2.1/jobs/runs/list",
                            params={"active_only": True}, headers=headers)
        if resp.ok:
            for run in resp.json().get("runs", []):
                job_name = run.get("run_name", "unknown")
                cluster_type = run.get("cluster_spec", {}).get("new_cluster", {}).get("node_type_id", "unknown")
                DATABRICKS_JOB_RUNS.labels(job_name=job_name, cluster_type=cluster_type).set(1)

def main():
    start_http_server(8000)
    logger.info("Metrics server started on :8000")
    collector = PipelineMetricsCollector(
        subscription_id="YOUR_SUBSCRIPTION_ID",
        rg="YOUR_RESOURCE_GROUP",
        adf_name="YOUR_ADF_NAME"
    )
    while True:
        try:
            collector.collect_adf_metrics()
            time.sleep(300)  # Scrape every 5 minutes
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()`,
      documentation: "Prometheus exporter for data pipeline health metrics. Scrapes ADF, Databricks, and dbt. Plug into Grafana for dashboards.",
      usageExample: "docker run -p 8000:8000 -e AZURE_CLIENT_ID=... pipeline-metrics-exporter",
      prerequisites: "Python 3.10+, azure-identity, prometheus-client, Databricks workspace URL and token, ADF service principal.",
    },

    // ETL/ELT
    {
      title: "Star Schema Fact Table Builder",
      description: "ELT pattern for building a star schema fact table from normalized source tables. Includes dimension lookups, surrogate key resolution, and audit columns.",
      categoryId: catMap["etl-elt"],
      authorId: userId,
      version: "1.0.0",
      language: "sql",
      complexity: "intermediate",
      isFeatured: 0,
      downloads: 1432,
      averageRating: 4.5,
      ratingCount: 61,
      tags: ["etl", "elt", "warehouse", "star-schema", "sql", "dimension"],
      code: `-- Star Schema Fact Table Builder
-- Builds fact_orders from normalized source tables with surrogate key lookups

INSERT INTO dw.fact_orders (
    -- Surrogate keys from dimensions
    order_date_key,
    customer_key,
    product_key,
    store_key,
    -- Measures
    quantity,
    unit_price,
    total_amount,
    discount_amount,
    net_amount,
    -- Audit
    source_order_id,
    load_date,
    pipeline_run_id
)
SELECT
    -- Date dimension lookup
    COALESCE(dd.date_key, -1) AS order_date_key,

    -- Customer dimension lookup (SCD2 - find active record)
    COALESCE(dc.customer_key, -1) AS customer_key,

    -- Product dimension lookup
    COALESCE(dp.product_key, -1) AS product_key,

    -- Store dimension lookup
    COALESCE(ds.store_key, -1) AS store_key,

    -- Measures
    o.quantity,
    o.unit_price,
    o.quantity * o.unit_price AS total_amount,
    COALESCE(p.discount_amount, 0) AS discount_amount,
    (o.quantity * o.unit_price) - COALESCE(p.discount_amount, 0) AS net_amount,

    -- Audit columns
    o.order_id AS source_order_id,
    CURRENT_DATE() AS load_date,
    :pipeline_run_id AS pipeline_run_id

FROM staging.orders o

-- Date lookup
LEFT JOIN dw.dim_date dd
    ON dd.full_date = CAST(o.order_date AS DATE)

-- Customer lookup (SCD2 - match to record active at order time)
LEFT JOIN dw.dim_customers dc
    ON dc.source_customer_id = o.customer_id
    AND o.order_date BETWEEN dc.effective_start_date AND dc.effective_end_date

-- Product lookup
LEFT JOIN dw.dim_products dp
    ON dp.source_product_id = o.product_id
    AND dp.is_current = TRUE

-- Store lookup
LEFT JOIN dw.dim_stores ds
    ON ds.source_store_id = o.store_id
    AND ds.is_current = TRUE

-- Promotions (optional join)
LEFT JOIN staging.promotions p
    ON p.order_id = o.order_id

-- Only load new records
WHERE o.order_date >= :load_date_from
  AND o.order_date < :load_date_to
  AND NOT EXISTS (
      SELECT 1 FROM dw.fact_orders fo WHERE fo.source_order_id = o.order_id
  );`,
      documentation: "Standard ELT pattern for fact table loading. Uses surrogate key -1 for unresolved dimension lookups (standard data warehouse practice).",
      usageExample: "Pass :pipeline_run_id, :load_date_from, :load_date_to as bind parameters from your orchestrator.",
      prerequisites: "All dimension tables must be loaded before fact tables. Date dimension must be pre-populated.",
    },

    // Fabric
    {
      title: "Fabric Lakehouse Ingestion Notebook",
      description: "Microsoft Fabric PySpark notebook for ingesting CSV/Parquet files from OneLake into Delta Lake tables with schema evolution, error handling, and audit logging.",
      categoryId: catMap["fabric"],
      authorId: devId,
      version: "1.1.0",
      language: "python",
      complexity: "intermediate",
      isFeatured: 0,
      downloads: 743,
      averageRating: 4.3,
      ratingCount: 28,
      tags: ["fabric", "lakehouse", "delta-lake", "pyspark", "azure"],
      code: `# Microsoft Fabric — Lakehouse Ingestion Notebook
# Ingests files from Files/ area into Tables/ as Delta Lake

import notebookutils
from pyspark.sql import SparkSession
from pyspark.sql.functions import current_timestamp, lit, input_file_name
from pyspark.sql.types import *

spark = SparkSession.builder.getOrCreate()

# ── Configuration ─────────────────────────────────────────────────────────
SOURCE_PATH = "Files/raw/sales/"          # OneLake path
TARGET_TABLE = "bronze.sales_raw"          # Lakehouse table
FILE_FORMAT = "parquet"                    # csv, parquet, json
AUDIT_TABLE = "audit.ingestion_log"

# ── Schema (define explicitly for CSV, use inferSchema=True for Parquet) ──
SOURCE_SCHEMA = StructType([
    StructField("order_id", StringType(), True),
    StructField("customer_id", StringType(), True),
    StructField("product_id", StringType(), True),
    StructField("quantity", IntegerType(), True),
    StructField("unit_price", DoubleType(), True),
    StructField("order_date", DateType(), True),
])

def ingest_to_lakehouse(source_path: str, target_table: str, file_format: str) -> dict:
    """Read files from OneLake Files area and write to Lakehouse Tables."""
    start_time = spark.sql("SELECT current_timestamp()").collect()[0][0]

    # Read source files
    reader = spark.read.format(file_format)
    if file_format == "csv":
        reader = reader.option("header", "true").schema(SOURCE_SCHEMA)
    elif file_format == "parquet":
        reader = reader.option("mergeSchema", "true")

    df = reader.load(source_path)

    if df.isEmpty():
        print(f"No files found at {source_path}")
        return {"status": "no_data", "rows": 0}

    # Add audit columns
    df_with_audit = (
        df
        .withColumn("_ingestion_time", current_timestamp())
        .withColumn("_source_file", input_file_name())
        .withColumn("_batch_id", lit(notebookutils.runtime.context.get("runId", "manual")))
    )

    # Write to Delta (append mode with schema evolution)
    df_with_audit.write \\
        .format("delta") \\
        .mode("append") \\
        .option("mergeSchema", "true") \\
        .saveAsTable(target_table)

    row_count = df_with_audit.count()
    print(f"✅ Ingested {row_count:,} rows into {target_table}")

    # Log to audit table
    spark.sql(f"""
        INSERT INTO {AUDIT_TABLE}
        VALUES ('{target_table}', {row_count}, '{start_time}', current_timestamp(), 'SUCCESS', NULL)
    """)

    return {"status": "success", "rows": row_count, "table": target_table}

# Run ingestion
try:
    result = ingest_to_lakehouse(SOURCE_PATH, TARGET_TABLE, FILE_FORMAT)
    notebookutils.notebook.exit(str(result))
except Exception as e:
    spark.sql(f"""
        INSERT INTO {AUDIT_TABLE}
        VALUES ('{TARGET_TABLE}', 0, current_timestamp(), current_timestamp(), 'FAILED', '{str(e)[:500]}')
    """)
    raise`,
      documentation: "Fabric Lakehouse ingestion notebook with schema evolution support, audit logging, and error handling. Works in Fabric pipelines as an activity.",
      usageExample: "Add as a Notebook activity in a Fabric Data Pipeline. Pass SOURCE_PATH and TARGET_TABLE as pipeline parameters.",
      prerequisites: "Microsoft Fabric workspace with Lakehouse. Audit table must exist. Files must be in OneLake Files/ section.",
    },

    // Incident Response
    {
      title: "Data Pipeline Incident Runbook",
      description: "Comprehensive incident response runbook for data engineering teams. Covers detection, triage, escalation, and resolution playbooks for common pipeline failures.",
      categoryId: catMap["incident-response"],
      authorId: adminId,
      version: "1.0.0",
      language: "text",
      complexity: "beginner",
      isFeatured: 0,
      downloads: 654,
      averageRating: 4.7,
      ratingCount: 43,
      tags: ["incident", "runbook", "playbook", "oncall", "monitoring"],
      code: `# Data Pipeline Incident Runbook
# Version: 1.0.0 | Last Updated: 2024-01

## Severity Levels

| Level | Response Time | Criteria |
|-------|--------------|----------|
| P1 🔴 | 15 min | Production data missing, dashboard SLA breach, revenue impact |
| P2 🟠 | 1 hour | Pipeline delayed >2h, data quality failures in prod |
| P3 🟡 | 4 hours | Non-critical pipeline failure, staging environment issues |
| P4 🟢 | 24 hours | Performance degradation, minor quality issues |

---

## P1 Response Playbook: Missing Production Data

### Step 1: Immediate Assessment (0-5 min)
\`\`\`sql
-- Check pipeline run history
SELECT pipeline_name, status, start_time, end_time, error_message
FROM etl_control.pipeline_runs
WHERE start_time >= DATEADD(hour, -6, GETUTCDATE())
ORDER BY start_time DESC;

-- Check data freshness
SELECT table_name, MAX(load_timestamp) as last_load, 
       DATEDIFF(minute, MAX(load_timestamp), GETUTCDATE()) as minutes_stale
FROM etl_control.table_metadata
GROUP BY table_name
HAVING DATEDIFF(minute, MAX(load_timestamp), GETUTCDATE()) > 120
ORDER BY minutes_stale DESC;
\`\`\`

### Step 2: Identify Root Cause (5-15 min)
- [ ] Check source system availability
- [ ] Review ADF pipeline run logs in Azure Portal
- [ ] Check Databricks job runs for cluster failures
- [ ] Review network/firewall changes (check with infra team)
- [ ] Check storage account quotas/throttling
- [ ] Review recent deployments (check #data-deployments Slack channel)

### Step 3: Communicate (immediate)
Post in #incidents: "@here P1 DATA INCIDENT: [Brief description]. ETA for update: 30 min."

### Step 4: Resolution Options
**Option A — Re-run pipeline:**
\`\`\`bash
az datafactory pipeline create-run \\
  --factory-name prod-adf \\
  --resource-group prod-rg \\
  --name pl_your_pipeline \\
  --parameters '{"reprocess_date": "2024-01-15"}'
\`\`\`

**Option B — Point-in-time recovery:**
\`\`\`sql
-- Restore from Delta Lake time travel
RESTORE TABLE dw.fact_orders TO TIMESTAMP AS OF '2024-01-15 08:00:00';
\`\`\`

**Option C — Manual backfill:**
\`\`\`sql
-- Insert from staging if available
INSERT INTO dw.fact_orders SELECT * FROM staging.fact_orders_backup WHERE load_date = CURRENT_DATE();
\`\`\`

### Step 5: Post-Incident
- [ ] Write RCA within 24h of resolution
- [ ] Add monitoring alert if none existed
- [ ] Update runbook with new learnings`,
      documentation: "Production incident runbook for data engineering teams. Copy and customize for your organization's tech stack and escalation paths.",
      usageExample: "Store in your team wiki. Link from PagerDuty/OpsGenie alert descriptions. Review quarterly.",
      prerequisites: "Customize Slack channel names, ADF resource names, and escalation contacts before using in production.",
    },

    // Spark
    {
      title: "Spark Batch Job — Partitioned Parquet Writer",
      description: "Optimized PySpark batch job for writing large datasets to partitioned Parquet on S3/ADLS with dynamic partition overwrite, compaction, and Z-ordering.",
      categoryId: catMap["spark"],
      authorId: userId,
      version: "1.0.0",
      language: "python",
      complexity: "advanced",
      isFeatured: 0,
      downloads: 892,
      averageRating: 4.6,
      ratingCount: 38,
      tags: ["pyspark", "batch", "parquet", "delta-lake", "performance", "scala"],
      code: `# Spark Batch Job — Optimized Partitioned Writer
# Writes large DataFrames to Delta/Parquet with dynamic partition overwrite

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, date_format, year, month, dayofmonth
from pyspark.sql.window import Window
import pyspark.sql.functions as F

spark = (
    SparkSession.builder
    .appName("PartitionedParquetWriter")
    .config("spark.sql.sources.partitionOverwriteMode", "dynamic")
    .config("spark.sql.adaptive.enabled", "true")
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
    .config("spark.sql.adaptive.skewJoin.enabled", "true")
    .config("spark.databricks.delta.optimizeWrite.enabled", "true")
    .config("spark.sql.shuffle.partitions", "auto")
    .getOrCreate()
)

OUTPUT_PATH = "s3a://your-bucket/processed/events"
TARGET_FILE_SIZE_MB = 128
PARTITION_COLS = ["year", "month", "day"]

def calculate_optimal_partitions(df, target_size_mb: int = 128) -> int:
    """Calculate number of Spark partitions based on data size."""
    avg_row_size = 500  # bytes estimate
    row_count = df.count()
    total_size_mb = (row_count * avg_row_size) / (1024 * 1024)
    return max(1, int(total_size_mb / target_size_mb))

def write_partitioned_output(df, output_path: str, partition_cols: list, mode: str = "overwrite"):
    """Write DataFrame with optimal partition sizing."""
    # Add partition columns if date-based
    if "event_timestamp" in df.columns:
        df = (
            df
            .withColumn("year", year(col("event_timestamp")).cast("string"))
            .withColumn("month", date_format(col("event_timestamp"), "MM"))
            .withColumn("day", date_format(col("event_timestamp"), "dd"))
        )

    # Remove skew with salting for high-cardinality partitions
    n_output_partitions = calculate_optimal_partitions(df, TARGET_FILE_SIZE_MB)
    print(f"Writing with {n_output_partitions} output partitions")

    (
        df
        .repartition(n_output_partitions, *[col(c) for c in partition_cols])
        .sortWithinPartitions(*partition_cols, "event_id")  # improve read performance
        .write
        .format("delta")
        .mode(mode)
        .partitionBy(*partition_cols)
        .option("overwriteSchema", "false")
        .option("dataChange", "true")
        .save(output_path)
    )
    print(f"✅ Written to {output_path}")

# Read source
df = spark.read.format("parquet").load("s3a://your-bucket/raw/events/")

# Apply transformations
df_clean = (
    df
    .filter(col("event_id").isNotNull())
    .dropDuplicates(["event_id"])
    .repartition(200)  # Increase parallelism before heavy transforms
)

write_partitioned_output(df_clean, OUTPUT_PATH, PARTITION_COLS)

# Optimize Delta table
spark.sql(f"OPTIMIZE delta.\`{OUTPUT_PATH}\` ZORDER BY (user_id, event_type)")
spark.sql(f"VACUUM delta.\`{OUTPUT_PATH}\` RETAIN 168 HOURS")`,
      documentation: "Optimized Spark batch job with dynamic partitioning, AQE enabled, and post-write optimization. Works on Databricks and EMR.",
      usageExample: "Submit as spark-submit job or Databricks task. Set target_size_mb based on your Parquet read pattern (128MB = good for analytics).",
      prerequisites: "Spark 3.3+, Delta Lake 2.x, object storage access configured. Set AWS/Azure credentials via spark configs or IAM role.",
    },

    // CI/CD
    {
      title: "Terraform Data Infrastructure CI/CD",
      description: "GitHub Actions workflow for Terraform-managed data infrastructure: plan on PR, apply on merge, drift detection, cost estimation, and Slack notifications.",
      categoryId: catMap["cicd"],
      authorId: adminId,
      version: "1.2.0",
      language: "yaml",
      complexity: "advanced",
      isFeatured: 0,
      downloads: 1104,
      averageRating: 4.5,
      ratingCount: 47,
      tags: ["terraform", "cicd", "github-actions", "iac", "azure", "devops"],
      code: `name: Terraform Data Infrastructure

on:
  push:
    branches: [main]
    paths: ['terraform/**']
  pull_request:
    branches: [main]
    paths: ['terraform/**']
  schedule:
    - cron: '0 8 * * 1'  # Weekly drift detection

env:
  TF_VERSION: '1.7.0'
  TF_WORKING_DIR: ./terraform/data-platform
  ARM_CLIENT_ID: \${{ secrets.AZURE_CLIENT_ID }}
  ARM_CLIENT_SECRET: \${{ secrets.AZURE_CLIENT_SECRET }}
  ARM_SUBSCRIPTION_ID: \${{ secrets.AZURE_SUBSCRIPTION_ID }}
  ARM_TENANT_ID: \${{ secrets.AZURE_TENANT_ID }}

jobs:
  terraform-plan:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: \${{ env.TF_VERSION }}

      - name: Terraform Init
        run: terraform init -backend-config="key=data-platform/\${{ github.head_ref }}.tfstate"
        working-directory: \${{ env.TF_WORKING_DIR }}

      - name: Terraform Validate
        run: terraform validate
        working-directory: \${{ env.TF_WORKING_DIR }}

      - name: Terraform Plan
        id: plan
        run: terraform plan -no-color -out=tfplan 2>&1 | tee plan_output.txt
        working-directory: \${{ env.TF_WORKING_DIR }}
        continue-on-error: true

      - name: Post Plan to PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('\${{ env.TF_WORKING_DIR }}/plan_output.txt', 'utf8');
            const summary = plan.split('\\n').slice(-10).join('\\n');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: \`## 🏗️ Terraform Plan\\n\\\`\\\`\\\`\\n\${summary}\\n\\\`\\\`\\\`\`
            });

  terraform-apply:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    concurrency:
      group: terraform-apply
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: \${{ env.TF_VERSION }}

      - name: Terraform Init & Apply
        run: |
          terraform init
          terraform apply -auto-approve
        working-directory: \${{ env.TF_WORKING_DIR }}

      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          channel-id: 'data-infra'
          slack-message: "\${{ job.status == 'success' && '✅' || '❌' }} Terraform apply \${{ job.status }} on \`data-platform\`"
        env:
          SLACK_BOT_TOKEN: \${{ secrets.SLACK_BOT_TOKEN }}`,
      documentation: "Full Terraform CI/CD for data infrastructure. Plans on PRs, applies on merge, weekly drift detection via schedule trigger.",
      usageExample: "Copy to .github/workflows/terraform.yml. Configure Azure service principal secrets and Slack token.",
      prerequisites: "Terraform >= 1.7, Azure service principal, remote Terraform state (Azure Storage or Terraform Cloud), Slack bot.",
    },
  ];

  // Insert templates
  for (const tmpl of templates) {
    const { tags: tagList, ...rest } = tmpl;
    const [inserted] = await db.insert(templatesTable).values(rest as any).returning();

    // Insert tags
    for (const tagName of tagList) {
      const tagId = tagMap[tagName];
      if (tagId) {
        await db.insert(templateTagsTable).values({ templateId: inserted.id, tagId }).onConflictDoNothing();
      }
    }

    // Insert version record
    await db.insert(templateVersionsTable).values({
      templateId: inserted.id,
      version: rest.version,
      code: rest.code,
      changelog: "Initial release",
      authorId: rest.authorId,
    });
  }

  console.log(`✅ ${templates.length} templates created`);
  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
