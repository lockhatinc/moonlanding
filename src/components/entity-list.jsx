'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldRender } from './field-render';
import { Search, Plus, ChevronDown, ChevronRight, File } from 'lucide-react';
import * as Icons from 'lucide-react';

export function EntityList({ spec, data, searchQuery = '', canCreate = false }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(new Set());
  const [sortField, setSortField] = useState(spec.list?.defaultSort?.field || null);
  const [sortDir, setSortDir] = useState(spec.list?.defaultSort?.dir || 'asc');

  const listFields = useMemo(() =>
    Object.entries(spec.fields)
      .filter(([_, f]) => f.list)
      .map(([key, f]) => ({ key, ...f })),
    [spec]
  );

  const groupBy = spec.list?.groupBy;

  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const cmp = aVal < bVal ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortField, sortDir]);

  const grouped = useMemo(() => {
    if (!groupBy) return { '': sortedData };
    return sortedData.reduce((acc, row) => {
      const g = row[groupBy] || 'Other';
      (acc[g] = acc[g] || []).push(row);
      return acc;
    }, {});
  }, [sortedData, groupBy]);

  const Icon = Icons[spec.icon] || File;

  const toggleGroup = (g) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  };

  const handleSort = (field) => {
    if (!listFields.find(f => f.key === field)?.sortable) return;
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const q = formData.get('q');
    router.push(`/${spec.name}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Icon className="h-6 w-6" />
          {spec.labelPlural}
        </h1>
        {canCreate && (
          <Button onClick={() => router.push(`/${spec.name}/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            New {spec.label}
          </Button>
        )}
      </div>

      <form onSubmit={handleSearch} className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={searchQuery}
          placeholder={`Search ${spec.labelPlural.toLowerCase()}...`}
          className="pl-9"
        />
      </form>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {groupBy && <TableHead className="w-8" />}
              {listFields.map(f => (
                <TableHead
                  key={f.key}
                  style={{ width: f.width }}
                  className={f.sortable ? 'cursor-pointer select-none' : ''}
                  onClick={() => handleSort(f.key)}
                >
                  <div className="flex items-center gap-1">
                    {f.label}
                    {f.sortable && sortField === f.key && (
                      <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(grouped).map(([group, rows]) => (
              <GroupRows
                key={group}
                group={group}
                rows={rows}
                groupBy={groupBy}
                expanded={expanded}
                toggleGroup={toggleGroup}
                listFields={listFields}
                spec={spec}
                router={router}
              />
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={listFields.length + (groupBy ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  No {spec.labelPlural.toLowerCase()} found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function GroupRows({ group, rows, groupBy, expanded, toggleGroup, listFields, spec, router }) {
  return (
    <>
      {groupBy && (
        <TableRow
          className="bg-muted/30 cursor-pointer"
          onClick={() => toggleGroup(group)}
        >
          <TableCell>
            {expanded.has(group) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </TableCell>
          <TableCell colSpan={listFields.length}>
            <span className="font-medium">{group}</span>
            <span className="ml-2 text-muted-foreground">({rows.length})</span>
          </TableCell>
        </TableRow>
      )}
      {(!groupBy || expanded.has(group)) &&
        rows.map(row => (
          <TableRow
            key={row.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`/${spec.name}/${row.id}`)}
          >
            {groupBy && <TableCell />}
            {listFields.map(f => (
              <TableCell key={f.key}>
                <FieldRender spec={spec} field={f} value={row[f.key]} row={row} />
              </TableCell>
            ))}
          </TableRow>
        ))}
    </>
  );
}
