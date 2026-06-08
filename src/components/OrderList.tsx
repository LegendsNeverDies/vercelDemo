"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, RefreshCw, Package, FileX, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast, nextToastId } from "@/lib/toast-utils";

interface Order {
  id: number;
  batch_id: string;
  external_code: string;
  store_name: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  sku_code: string;
  sku_name: string;
  sku_quantity: number;
  sku_spec: string;
  remark: string;
  created_at: string;
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [externalCode, setExternalCode] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 多选相关状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("size", String(size));
      if (externalCode) params.set("externalCode", externalCode);
      if (receiverName) params.set("receiverName", receiverName);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotal(data.pagination.total);
      }
    } catch {
      toast.error("加载数据失败", { id: nextToastId() });
    } finally {
      setLoading(false);
    }
  }, [page, size, externalCode, receiverName, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(total / size);

  const handleReset = () => {
    setExternalCode("");
    setReceiverName("");
    setStartDate("");
    setEndDate("");
    setSelectedIds(new Set());
    setPage(1);
  };

  const clearSelection = () => setSelectedIds(new Set());

  // 当前页所有 ID
  const currentPageIds = useMemo(
    () => orders.map((o) => o.id),
    [orders]
  );

  // 当前页已选数量
  const currentPageSelectedCount = useMemo(
    () => currentPageIds.filter((id) => selectedIds.has(id)).length,
    [currentPageIds, selectedIds]
  );

  // 全选状态：当前页所有项都被选中 -> checked；部分选中 -> indeterminate
  const isAllCurrentSelected =
    currentPageIds.length > 0 && currentPageSelectedCount === currentPageIds.length;
  const isPartialCurrentSelected =
    currentPageSelectedCount > 0 && currentPageSelectedCount < currentPageIds.length;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllCurrentSelected) {
        // 取消当前页所有选择
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        // 选中当前页所有项
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error("请先选择要删除的运单", { id: nextToastId() });
      return;
    }
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const ids = Array.from(selectedIds);
    setDeleting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`成功删除 ${data.data?.deleted ?? ids.length} 条运单`, {
          id: nextToastId(),
        });
        setSelectedIds(new Set());
        setConfirmOpen(false);
        // 重新拉取列表
        // 如果当前页被清空且不是第1页，回到上一页
        if (orders.length === ids.length && page > 1) {
          setPage(page - 1);
        } else {
          fetchOrders();
        }
      } else {
        toast.error(data.message || "删除失败", { id: nextToastId() });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("删除失败：" + message, {
        id: nextToastId(),
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-5 h-5 text-[#0fc6c2]" />
          已导入运单列表
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="ml-2 bg-[#0fc6c2]/10 text-[#0b6e6e]">
              已选 {selectedIds.size} 条
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-end">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">外部编码</label>
            <Input
              placeholder="外部编码"
              value={externalCode}
              onChange={(e) => setExternalCode(e.target.value)}
              className="w-36 md:w-48"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">收件人</label>
            <Input
              placeholder="收件人姓名"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className="w-36 md:w-48"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">开始日期</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">结束日期</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
          <Button onClick={() => { setPage(1); clearSelection(); fetchOrders(); }}>
            <Search className="w-4 h-4 mr-1" /> 查询
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-1" /> 重置
          </Button>
          <div className="flex-1" />
          <Button
            variant="destructive"
            disabled={selectedIds.size === 0 || deleting}
            onClick={handleBatchDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            批量删除{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#e8fafa]">
                <TableHead className="text-[#0b6e6e] w-[50px]">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isAllCurrentSelected}
                      indeterminate={isPartialCurrentSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="全选当前页"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-[#0b6e6e]">外部编码</TableHead>
                <TableHead className="text-[#0b6e6e]">收货门店</TableHead>
                <TableHead className="text-[#0b6e6e]">收件人</TableHead>
                <TableHead className="text-[#0b6e6e]">电话</TableHead>
                <TableHead className="text-[#0b6e6e]">地址</TableHead>
                <TableHead className="text-[#0b6e6e]">SKU编码</TableHead>
                <TableHead className="text-[#0b6e6e]">SKU名称</TableHead>
                <TableHead className="text-[#0b6e6e]">数量</TableHead>
                <TableHead className="text-[#0b6e6e]">提交时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin text-[#0fc6c2]" />
                      <span className="text-sm">加载中...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <FileX className="w-10 h-10" />
                      <span className="text-sm">暂无数据</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const checked = selectedIds.has(order.id);
                  return (
                    <TableRow
                      key={order.id}
                      className={`hover:bg-gray-50 ${checked ? "bg-[#0fc6c2]/5" : ""}`}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleSelectOne(order.id)}
                            aria-label={`选择运单 ${order.id}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{order.external_code || "-"}</TableCell>
                      <TableCell className="text-xs">{order.store_name || "-"}</TableCell>
                      <TableCell className="text-xs">{order.receiver_name || "-"}</TableCell>
                      <TableCell className="text-xs">{order.receiver_phone || "-"}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{order.receiver_address || "-"}</TableCell>
                      <TableCell className="text-xs">{order.sku_code}</TableCell>
                      <TableCell className="text-xs">{order.sku_name}</TableCell>
                      <TableCell className="text-xs">{order.sku_quantity}</TableCell>
                      <TableCell className="text-xs">{order.created_at}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              共 {total} 条，第 {page} / {totalPages || 1} 页
            </span>
            <select
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); clearSelection(); setPage(1); }}
              className="text-sm border rounded px-1 py-0.5"
            >
              <option value="10">10条/页</option>
              <option value="20">20条/页</option>
              <option value="50">50条/页</option>
            </select>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => { clearSelection(); setPage(p => p - 1); }}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => { clearSelection(); setPage(p => p + 1); }}
            >
              下一页
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => !deleting && setConfirmOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除已选中的 <span className="font-semibold text-destructive">{selectedIds.size}</span> 条运单吗？此操作不可恢复，请谨慎操作。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={deleting} />}>
              取消
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> 删除中...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" /> 确认删除
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
