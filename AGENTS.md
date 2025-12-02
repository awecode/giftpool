## Drizzle ORM

* Refrain from manually defining column names inside the data type constructor.

```diff
- guestCode: text('guest_code').notNull().unique(),
+ guestCode: text().notNull().unique(),
```

* For time data types, use the following for sqlite:
fieldName: integer({ mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch()*1000)`),

## Nuxt UI

* There's no UFormGroup in Nuxt UI anymore, use UFormField instead.

```
<UFormField label="Email">
    <UInput placeholder="Enter your email" />
</UFormField>
```
